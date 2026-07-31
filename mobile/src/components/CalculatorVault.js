import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CalculatorVault({ onUnlock }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState('');
  
  const [savedPasscode, setSavedPasscode] = useState(null);
  const [setupStep, setSetupStep] = useState(1);
  const [firstPasscode, setFirstPasscode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPasscode();
  }, []);

  const loadPasscode = async () => {
    try {
      const code = await AsyncStorage.getItem('vault_passcode');
      if (code) {
        setSavedPasscode(code);
        setMessage('Enter 4-digit passcode & press =');
      } else {
        setMessage('Step 1 of 2: Set 4-digit passcode & press =');
      }
    } catch (e) {
      console.log('Error loading vault passcode:', e);
    }
  };

  const handleNumber = (digit) => {
    if (display === '0' || display === 'Error') {
      setDisplay(digit);
    } else if (display.length < 12) {
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

  const handleEquals = async () => {
    const cleanDisplay = display.trim();

    // 1. FIRST TIME SETUP MODE
    if (!savedPasscode) {
      if (setupStep === 1) {
        if (/^\d{4}$/.test(cleanDisplay)) {
          setFirstPasscode(cleanDisplay);
          setSetupStep(2);
          setDisplay('0');
          setMessage('Step 2 of 2: Re-enter passcode & press =');
        } else {
          setMessage('Passcode must be 4 digits!');
        }
        return;
      } else if (setupStep === 2) {
        if (cleanDisplay === firstPasscode) {
          await AsyncStorage.setItem('vault_passcode', cleanDisplay);
          setSavedPasscode(cleanDisplay);
          setMessage('✅ Passcode Created! Unlocking...');
          setTimeout(() => onUnlock(), 600);
        } else {
          setMessage('❌ Passcodes do not match! Try again.');
          setSetupStep(1);
          setFirstPasscode('');
          setDisplay('0');
        }
        return;
      }
    }

    // 2. PASSCODE MATCH
    if (savedPasscode && cleanDisplay === savedPasscode) {
      setMessage('✅ Access Granted!');
      setTimeout(() => onUnlock(), 400);
      return;
    }

    // 3. MATH EVALUATION
    try {
      let fullExpr = equation + display;
      setHistory(`${fullExpr} =`);
      let sanitized = fullExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/[^0-9+\-*/%. ]/g, '');
      if (!sanitized) {
        setDisplay('0');
        return;
      }
      const result = new Function(`return ${sanitized}`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        setDisplay(result.toString());
      } else {
        setDisplay('Error');
      }
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  const handleOperator = (op) => {
    setHistory(`${display} ${op}`);
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧮 Calculator</Text>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      <View style={styles.displayContainer}>
        <Text style={styles.historyText}>{history || equation || ' '}</Text>
        <Text style={styles.displayText}>{display}</Text>
      </View>

      <View style={styles.grid}>
        {/* Row 1 */}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.btnFunc]} onPress={handleClear}>
            <Text style={styles.btnFuncText}>AC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnFunc]} onPress={handleDelete}>
            <Text style={styles.btnFuncText}>DEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnFunc]} onPress={() => handleOperator('%')}>
            <Text style={styles.btnFuncText}>%</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnOp]} onPress={() => handleOperator('÷')}>
            <Text style={styles.btnOpText}>÷</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('7')}>
            <Text style={styles.btnNumText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('8')}>
            <Text style={styles.btnNumText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('9')}>
            <Text style={styles.btnNumText}>9</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnOp]} onPress={() => handleOperator('×')}>
            <Text style={styles.btnOpText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('4')}>
            <Text style={styles.btnNumText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('5')}>
            <Text style={styles.btnNumText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('6')}>
            <Text style={styles.btnNumText}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnOp]} onPress={() => handleOperator('-')}>
            <Text style={styles.btnOpText}>-</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4 */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('1')}>
            <Text style={styles.btnNumText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('2')}>
            <Text style={styles.btnNumText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('3')}>
            <Text style={styles.btnNumText}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnOp]} onPress={() => handleOperator('+')}>
            <Text style={styles.btnOpText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Row 5 */}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, { flex: 2 }]} onPress={() => handleNumber('0')}>
            <Text style={styles.btnNumText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => handleNumber('.')}>
            <Text style={styles.btnNumText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnEqual]} onPress={handleEquals}>
            <Text style={styles.btnEqualText}>=</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'space-between',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageText: {
    color: '#06b6d4',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  displayContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  historyText: {
    color: '#64748b',
    fontSize: 14,
  },
  displayText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 8,
  },
  grid: {
    gap: 12,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNumText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '600',
  },
  btnFunc: {
    backgroundColor: '#334155',
  },
  btnFuncText: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  btnOp: {
    backgroundColor: '#0891b2',
  },
  btnOpText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  btnEqual: {
    backgroundColor: '#06b6d4',
  },
  btnEqualText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});
