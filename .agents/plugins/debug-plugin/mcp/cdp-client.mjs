/**
 * Chrome DevTools Protocol (CDP) Autonomous Debugger Client
 * Connects directly to Node.js --inspect WebSocket endpoint to programmatically
 * control breakpoints, catch unhandled exceptions, and evaluate live heap variables.
 */
export async function runCdpInspection({
  inspectPort = 9229,
  timeoutMs = 15000,
  pauseOnExceptions = 'uncaught',
  expressions = [],
  breakpoints = []
}) {
  return new Promise(async (resolve, reject) => {
    let timer;
    let ws;

    try {
      // 1. Query Node inspect target list
      const listRes = await fetch(`http://127.0.0.1:${inspectPort}/json/list`);
      if (!listRes.ok) {
        throw new Error(`Failed to query inspect port ${inspectPort}: HTTP ${listRes.status}`);
      }
      const targets = await listRes.json();
      if (!Array.isArray(targets) || targets.length === 0) {
        throw new Error(`No active Node.js inspect targets found on port ${inspectPort}`);
      }

      const wsUrl = targets[0].webSocketDebuggerUrl;
      if (!wsUrl) {
        throw new Error(`Target on port ${inspectPort} does not expose webSocketDebuggerUrl`);
      }

      ws = new WebSocket(wsUrl);

      let reqId = 1;
      const pendingEvals = new Map();
      let capturedPause = null;
      let evaluatedVars = {};

      timer = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            // Guarantee Node runtime is unpaused before disconnecting
            ws.send(JSON.stringify({ id: 9998, method: 'Debugger.resume' }));
            ws.send(JSON.stringify({ id: 9999, method: 'Debugger.disable' }));
            ws.close();
          } catch {}
        }
        if (capturedPause) {
          resolve({
            status: 'PAUSED',
            reason: capturedPause.reason,
            exception: capturedPause.exception,
            topFrame: capturedPause.topFrame,
            callStack: capturedPause.callStack,
            evaluatedVariables: evaluatedVars
          });
        } else {
          resolve({
            status: 'CLEAN_NO_EXCEPTION',
            message: `Inspect session ran for ${timeoutMs}ms without triggering uncaught exceptions.`
          });
        }
      }, timeoutMs);

      ws.onopen = () => {
        // Enable Debugger & Runtime domains
        ws.send(JSON.stringify({ id: reqId++, method: 'Debugger.enable' }));
        ws.send(JSON.stringify({ id: reqId++, method: 'Runtime.enable' }));

        // Pause on uncaught exceptions
        if (pauseOnExceptions && pauseOnExceptions !== 'none') {
          ws.send(JSON.stringify({
            id: reqId++,
            method: 'Debugger.setPauseOnExceptions',
            params: { state: pauseOnExceptions }
          }));
        }

        // Set breakpoints if requested
        if (Array.isArray(breakpoints)) {
          for (const bp of breakpoints) {
            ws.send(JSON.stringify({
              id: reqId++,
              method: 'Debugger.setBreakpointByUrl',
              params: {
                urlRegex: bp.urlRegex || bp.file,
                lineNumber: (bp.line || 1) - 1
              }
            }));
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Handle Debugger.paused event
          if (msg.method === 'Debugger.paused') {
            const callFrames = msg.params?.callFrames || [];
            const topFrame = callFrames[0] || {};
            const exceptionData = msg.params?.data;

            capturedPause = {
              reason: msg.params?.reason || 'unknown',
              exception: exceptionData ? {
                type: exceptionData.type,
                description: exceptionData.description,
                className: exceptionData.className
              } : null,
              topFrame: {
                callFrameId: topFrame.callFrameId,
                functionName: topFrame.functionName || '(anonymous)',
                url: topFrame.url,
                line: (topFrame.location?.lineNumber || 0) + 1,
                column: (topFrame.location?.columnNumber || 0) + 1
              },
              callStack: callFrames.slice(0, 8).map(f => ({
                functionName: f.functionName || '(anonymous)',
                url: f.url,
                line: (f.location?.lineNumber || 0) + 1,
                column: (f.location?.columnNumber || 0) + 1
              }))
            };

            // Evaluate expressions on paused call frame if requested
            if (expressions.length > 0 && topFrame.callFrameId) {
              for (const expr of expressions) {
                const evalId = reqId++;
                pendingEvals.set(evalId, expr);
                ws.send(JSON.stringify({
                  id: evalId,
                  method: 'Debugger.evaluateOnCallFrame',
                  params: {
                    callFrameId: topFrame.callFrameId,
                    expression: expr,
                    returnByValue: true
                  }
                }));
              }
            } else {
              // No expressions: resume immediately
              ws.send(JSON.stringify({ id: reqId++, method: 'Debugger.resume' }));
              clearTimeout(timer);
              setTimeout(() => {
                ws.close();
                resolve({
                  status: 'PAUSED',
                  reason: capturedPause.reason,
                  exception: capturedPause.exception,
                  topFrame: capturedPause.topFrame,
                  callStack: capturedPause.callStack,
                  evaluatedVariables: {}
                });
              }, 100);
            }
          }

          // Handle evaluation responses
          if (msg.id && pendingEvals.has(msg.id)) {
            const expr = pendingEvals.get(msg.id);
            pendingEvals.delete(msg.id);

            const result = msg.result?.result;
            evaluatedVars[expr] = result ? {
              type: result.type,
              value: result.value !== undefined ? result.value : result.description,
              unserializable: result.unserializableValue
            } : { error: msg.error?.message || 'evaluation failed' };

            // When all expressions evaluated: resume and resolve
            if (pendingEvals.size === 0 && capturedPause) {
              ws.send(JSON.stringify({ id: reqId++, method: 'Debugger.resume' }));
              clearTimeout(timer);
              setTimeout(() => {
                ws.close();
                resolve({
                  status: 'PAUSED',
                  reason: capturedPause.reason,
                  exception: capturedPause.exception,
                  topFrame: capturedPause.topFrame,
                  callStack: capturedPause.callStack,
                  evaluatedVariables: evaluatedVars
                });
              }, 100);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timer);
        reject(new Error(`CDP WebSocket error: ${err.message || 'connection failed'}`));
      };
    } catch (err) {
      if (timer) clearTimeout(timer);
      reject(err);
    }
  });
}
