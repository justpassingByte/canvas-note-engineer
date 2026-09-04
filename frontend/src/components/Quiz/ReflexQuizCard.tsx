import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { ReflexQuiz } from '../../types/graphTypes.js';

interface ReflexQuizCardProps {
  quiz: ReflexQuiz;
}

export const ReflexQuizCard: React.FC<ReflexQuizCardProps> = ({ quiz }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(idx);
  };

  const isAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === quiz.dung;

  return (
    <div className="khoi-quiz-phan-xa">
      <div className="tieu-de-khoi" style={{ color: '#059669' }}>
        <HelpCircle className="lucide-icon-sm" />
        <span>THỬ THÁCH PHẢN XẠ KỸ SƯ</span>
      </div>

      <div className="quiz-cau-hoi">{quiz.cau_hoi}</div>

      <div className="quiz-danh-sach-lua-chon">
        {quiz.lua_chon.map((ans, idx) => {
          let btnClass = 'quiz-lua-chon';
          if (isAnswered) {
            if (idx === quiz.dung) {
              btnClass += ' dung';
            } else if (idx === selectedIndex) {
              btnClass += ' sai';
            }
          }

          return (
            <button
              key={idx}
              className={btnClass}
              disabled={isAnswered}
              onClick={() => handleSelect(idx)}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: 'var(--net-muc-phu)' }}>
                {idx === 0 ? 'A.' : 'B.'}
              </span>
              <span>{ans}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="quiz-giai-thich">
          <strong>{isCorrect ? '✅ Chuẩn xác!' : '⚠️ Cần lưu ý:'}</strong> {quiz.giai_thich}
        </div>
      )}
    </div>
  );
};
