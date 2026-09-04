---
name: port-manager
description: Port Manager & Process Killer for development servers. Automatically detects and frees ports blocked by EADDRINUSE (e.g., 3000, 5173, 8080) on Windows/PowerShell.
---

# Port Manager & EADDRINUSE Killer

Use this skill when encountering `EADDRINUSE: address already in use` or when the user asks to inspect/kill running dev ports.

## Quick Detection & Kill Procedures (PowerShell)

### 1. Check which process occupies a port
```powershell
$port = 5173  # Change to target port
Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object LocalPort, State, OwningProcess |
    ForEach-Object {
        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        [PSCustomObject]@{
            Port = $_.LocalPort
            PID = $_.OwningProcess
            ProcessName = $proc.ProcessName
            Path = $proc.Path
        }
    }
```

### 2. Kill the blocking process immediately
```powershell
$port = 5173
$conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($conn) {
    $pids = $conn.OwningProcess | Select-Object -Unique
    Stop-Process -Id $pids -Force -ErrorAction SilentlyContinue
    Write-Host "Killed process $pids on port $port"
} else {
    Write-Host "Port $port is free"
}
```

### 3. Check all common dev ports at once
```powershell
$ports = 3000, 5173, 8000, 8080, 5432, 6379
Get-NetTCPConnection -LocalPort $ports -ErrorAction SilentlyContinue |
    Select-Object LocalPort, State, OwningProcess
```
