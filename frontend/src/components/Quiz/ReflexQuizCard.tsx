import React, { useState } from 'react';
import { HelpCircle, ChevronRight, RotateCcw, CheckCircle2, Award, Zap } from 'lucide-react';
import { ReflexQuiz, ReflexQuizItem } from '../../types/graphTypes.js';

interface ReflexQuizCardProps {
  quiz: ReflexQuiz;
  quizList?: ReflexQuizItem[];
}

export const ReflexQuizCard: React.FC<ReflexQuizCardProps> = ({ quiz, quizList }) => {
  // Normalize into an array of quiz items
  const questions: ReflexQuizItem[] = React.useMemo(() => {
    if (quizList && quizList.length > 0) return quizList;
    if (Array.isArray(quiz)) return quiz;
    if (quiz && typeof quiz === 'object') return [quiz as ReflexQuizItem];
    return [];
  }, [quiz, quizList]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];
  const selectedIndex = selectedAnswers[currentIndex] ?? null;
  const isAnswered = selectedIndex !== null;
  const isCorrect = isAnswered && selectedIndex === currentQ?.dung;

  const handleSelect = (idx: number) => {
    if (isAnswered || !currentQ) return;
    const correct = idx === currentQ.dung;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: idx }));
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setIsCompleted(false);
  };

  if (!currentQ) return null;

  return (
    <div className="khoi-quiz-phan-xa" style={{ border: '1.5px solid #10B981', background: '#F0FDF4', borderRadius: '8px', padding: '14px' }}>
      {/* Quiz Header & Multi-step Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div className="tieu-de-khoi" style={{ color: '#059669', margin: 0 }}>
          <Zap className="lucide-icon-sm" />
          <span>CHUỖI PHẢN XẠ KỸ SƯ THỰC CHIẾN</span>
        </div>

        {questions.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 800, color: '#047857' }}>
              CÂU {currentIndex + 1}/{questions.length}
            </span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {questions.map((_, qIdx) => (
                <div
                  key={qIdx}
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: qIdx === currentIndex
                      ? '#059669'
                      : (selectedAnswers[qIdx] !== undefined
                          ? (selectedAnswers[qIdx] === questions[qIdx].dung ? '#10B981' : '#EF4444')
                          : '#D1FAE5')
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Level Tag Pill */}
      {currentQ.phan_tang && (
        <div style={{ display: 'inline-block', padding: '2px 8px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '4px', fontSize: '9.5px', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>
          🎯 PHÂN TẦNG: {currentQ.phan_tang.toUpperCase()}
        </div>
      )}

      {!isCompleted ? (
        <>
          <div className="quiz-cau-hoi" style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937', lineHeight: 1.45, marginBottom: '10px' }}>
            {currentQ.cau_hoi}
          </div>

          <div className="quiz-danh-sach-lua-chon" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {currentQ.lua_chon.map((ans, idx) => {
              let btnBg = '#FFFFFF';
              let btnBorder = '#E5E7EB';
              let btnColor = '#374151';

              if (isAnswered) {
                if (idx === currentQ.dung) {
                  btnBg = '#DCFCE7';
                  btnBorder = '#10B981';
                  btnColor = '#065F46';
                } else if (idx === selectedIndex) {
                  btnBg = '#FEE2E2';
                  btnBorder = '#EF4444';
                  btnColor = '#991B1B';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelect(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: btnBg,
                    border: `1.5px solid ${btnBorder}`,
                    borderRadius: '6px',
                    textAlign: 'left',
                    cursor: isAnswered ? 'default' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: btnColor,
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontWeight: 900, color: idx === currentQ.dung && isAnswered ? '#059669' : '#6B7280' }}>
                    {idx === 0 ? 'A.' : 'B.'}
                  </span>
                  <span>{ans}</span>
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div style={{ marginTop: '10px', padding: '10px 12px', background: isCorrect ? '#DCFCE7' : '#FEF2F2', border: `1px solid ${isCorrect ? '#86EFAC' : '#FECACA'}`, borderRadius: '6px', fontSize: '11px', lineHeight: 1.45, color: isCorrect ? '#065F46' : '#991B1B' }}>
              <strong>{isCorrect ? '✅ Chuẩn xác!' : '⚠️ Cần lưu ý:'}</strong> {currentQ.giai_thich}

              {questions.length > 1 && (
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleNext}
                    style={{
                      padding: '5px 12px',
                      background: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Summary Screen when completed all questions */
        <div style={{ textAlign: 'center', padding: '12px 6px' }}>
          <Award size={32} color="#059669" style={{ margin: '0 auto 6px auto' }} />
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>
            HOÀN THÀNH {questions.length}/{questions.length} CÂU HỎI SÁT HẠCH!
          </div>
          <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>
            Điểm số của bạn: <strong>{score}/{questions.length}</strong> (
            {score === questions.length ? 'Xuất sắc - Chuẩn Kiến trúc sư Cấp cao' : 'Khá - Cần củng cố thêm các ca biên'})
          </div>
          <button
            onClick={handleReset}
            style={{
              marginTop: '12px',
              padding: '6px 14px',
              background: '#FFFFFF',
              border: '1.5px solid #059669',
              borderRadius: '6px',
              color: '#059669',
              fontSize: '10.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={12} />
            <span>Luyện lại chuỗi phản xạ</span>
          </button>
        </div>
      )}
    </div>
  );
};
