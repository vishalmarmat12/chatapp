import React, { useState, useEffect } from 'react';

export default function CalculatorVault({ onUnlock }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState('');
  const [savedPasscode, setSavedPasscode] = useState(null);

  useEffect(() => {
    const code = localStorage.getItem('vault_passcode');
    if (code) {
      setSavedPasscode(code);
    }
  }, []);

  const handleNumber = (digit) => {
    if (display === '0' || display === 'Error') {
      setDisplay(digit);
    } else if (display.length < 14) {
      setDisplay(display + digit);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setHistory('');
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handlePercent = () => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        setDisplay((val / 100).toString());
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleOperator = (op) => {
    setHistory(`${display} ${op}`);
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  const handleEquals = () => {
    const cleanDisplay = display.trim();

    // 1. Secret Unlock Check
    if (savedPasscode) {
      if (cleanDisplay === savedPasscode) {
        onUnlock();
        return;
      }
    } else {
      // First time setup - 4 digits sets default passcode and unlocks
      if (/^\d{4}$/.test(cleanDisplay)) {
        localStorage.setItem('vault_passcode', cleanDisplay);
        setSavedPasscode(cleanDisplay);
        onUnlock();
        return;
      }
    }

    // 2. Standard Math Calculation
    try {
      let fullExpr = equation + display;
      setHistory(`${fullExpr} =`);
      
      let sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/[^0-9+\-*/%. ]/g, '');

      if (!sanitized) {
        setDisplay('0');
        return;
      }

      const result = new Function(`return ${sanitized}`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        const formatted = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(6)).toString();
        setDisplay(formatted);
      } else {
        setDisplay('Error');
      }
      setEquation('');
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 flex items-center justify-center p-4 selection:bg-none font-sans text-slate-900">
      {/* CALCULATOR APP CONTAINER MATCHING STOCK UI */}
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl flex flex-col gap-6">
        
        {/* TOP BAR / TABS */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button className="text-slate-500 text-lg hover:text-slate-800">
            ⤢
          </button>
          <div className="flex items-center gap-4">
            <span className="text-base font-bold text-slate-900">Calculator</span>
            <span className="text-base font-medium text-slate-400">Converter</span>
          </div>
          <button className="text-slate-500 text-xl font-bold hover:text-slate-800">
            ⋮
          </button>
        </div>

        {/* CALCULATOR DISPLAY SCREEN */}
        <div className="bg-white text-right flex flex-col justify-end min-h-[140px] px-3 font-sans">
          {history && (
            <div className="text-slate-400 text-lg mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
              {history}
            </div>
          )}
          <div className="text-slate-900 text-5xl font-light tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none">
            {display}
          </div>
        </div>

        {/* BUTTON GRID MATCHING EXACT BUTTON STYLES */}
        <div className="grid grid-cols-4 gap-3">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-orange-600 font-semibold text-xl border border-slate-100 shadow-sm transition flex items-center justify-center"
          >
            AC
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-orange-600 font-semibold text-xl border border-slate-100 shadow-sm transition flex items-center justify-center"
          >
            ⌫
          </button>
          <button
            onClick={handlePercent}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-orange-600 font-semibold text-xl border border-slate-100 shadow-sm transition flex items-center justify-center"
          >
            %
          </button>
          <button
            onClick={() => handleOperator('÷')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-orange-600 font-semibold text-2xl border border-slate-100 shadow-sm transition flex items-center justify-center"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumber('7')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            7
          </button>
          <button
            onClick={() => handleNumber('8')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            8
          </button>
          <button
            onClick={() => handleNumber('9')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            9
          </button>
          <button
            onClick={() => handleOperator('×')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-orange-600 font-semibold text-2xl border border-slate-100 shadow-sm transition flex items-center justify-center"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumber('4')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            4
          </button>
          <button
            onClick={() => handleNumber('5')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            5
          </button>
          <button
            onClick={() => handleNumber('6')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            6
          </button>
          <button
            onClick={() => handleOperator('−')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-orange-600 font-semibold text-2xl border border-slate-100 shadow-sm transition flex items-center justify-center"
          >
            −
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleNumber('1')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            1
          </button>
          <button
            onClick={() => handleNumber('2')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            2
          </button>
          <button
            onClick={() => handleNumber('3')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-orange-600 font-semibold text-2xl border border-slate-100 shadow-sm transition flex items-center justify-center"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={handleClear}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-orange-600 font-semibold text-xl border border-slate-100 shadow-sm transition flex items-center justify-center"
          >
            ⟲
          </button>
          <button
            onClick={() => handleNumber('0')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            0
          </button>
          <button
            onClick={() => setDisplay(prev => prev.includes('.') ? prev : prev + '.')}
            className="h-16 rounded-2xl bg-white hover:bg-slate-50 active:scale-95 text-slate-900 font-normal text-2xl border border-slate-100 shadow-sm transition"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="h-16 rounded-2xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-semibold text-3xl shadow-lg shadow-orange-500/30 transition flex items-center justify-center"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
