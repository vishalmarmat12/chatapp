import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CalculatorVault({ onUnlock }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState('');
  const [savedPasscode, setSavedPasscode] = useState(null);

  useEffect(() => {
    loadPasscode();
  }, []);

  const loadPasscode = async () => {
    try {
      const code = await AsyncStorage.getItem('vault_passcode');
      if (code) {
        setSavedPasscode(code);
      }
    } catch (e) {
      console.log('Error loading vault passcode:', e);
    }
  };

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

  const handleEquals = async () => {
    const cleanDisplay = display.trim();

    // 1. Secret Unlock Check
    if (savedPasscode) {
      if (cleanDisplay === savedPasscode) {
        onUnlock();
        return;
      }
    } else {
      // First time setup - 4 digits sets default passcode and unlocks seamlessly
      if (/^\d{4}$/.test(cleanDisplay)) {
        await AsyncStorage.setItem('vault_passcode', cleanDisplay);
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
    }
  };

  const handleOperator = (op) => {
    setHistory(`${display} ${op}`);
    setEquation(`${display} ${op} `);
    setDisplay('0');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Top Header Bar matching Android Stock Calculator */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.headerIconTxt}>⤢</Text>
        </TouchableOpacity>

        <View style={styles.tabsContainer}>
          <Text style={styles.activeTab}>Calculator</Text>
          <Text style={styles.inactiveTab}>Converter</Text>
        </View>

        <TouchableOpacity style={styles.headerIconBtn}>
          <Text style={styles.menuIconTxt}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Display */}
      <View style={styles.displayArea}>
        {history ? <Text style={styles.historyTxt}>{history}</Text> : null}
        <Text style={styles.displayTxt} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      {/* Calculator Keypad */}
      <View style={styles.keypad}>
        {/* Row 1 */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.keyBtn} onPress={handleClear}>
            <Text style={styles.orangeTxt}>AC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={handleDelete}>
            <Text style={styles.orangeTxt}>⌫</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={handlePercent}>
            <Text style={styles.orangeTxt}>%</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleOperator('÷')}>
            <Text style={styles.orangeTxt}>÷</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('7')}>
            <Text style={styles.numTxt}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('8')}>
            <Text style={styles.numTxt}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('9')}>
            <Text style={styles.numTxt}>9</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleOperator('×')}>
            <Text style={styles.orangeTxt}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('4')}>
            <Text style={styles.numTxt}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('5')}>
            <Text style={styles.numTxt}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('6')}>
            <Text style={styles.numTxt}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleOperator('−')}>
            <Text style={styles.orangeTxt}>−</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4 */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('1')}>
            <Text style={styles.numTxt}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('2')}>
            <Text style={styles.numTxt}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('3')}>
            <Text style={styles.numTxt}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleOperator('+')}>
            <Text style={styles.orangeTxt}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Row 5 */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.keyBtn} onPress={handleClear}>
            <Text style={styles.orangeTxt}>⟲</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('0')}>
            <Text style={styles.numTxt}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.keyBtn} onPress={() => handleNumber('.')}>
            <Text style={styles.numTxt}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.keyBtn, styles.equalBtn]} onPress={handleEquals}>
            <Text style={styles.equalTxt}>=</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIconBtn: {
    padding: 6,
  },
  headerIconTxt: {
    fontSize: 20,
    color: '#4b5563',
  },
  menuIconTxt: {
    fontSize: 22,
    color: '#4b5563',
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  activeTab: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  inactiveTab: {
    fontSize: 17,
    fontWeight: '400',
    color: '#9ca3af',
  },
  displayArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  historyTxt: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 8,
  },
  displayTxt: {
    fontSize: 56,
    fontWeight: '400',
    color: '#111827',
    textAlign: 'right',
  },
  keypad: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyBtn: {
    flex: 1,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  numTxt: {
    fontSize: 26,
    color: '#111827',
    fontWeight: '400',
  },
  orangeTxt: {
    fontSize: 24,
    color: '#ea580c',
    fontWeight: '500',
  },
  equalBtn: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  equalTxt: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: '600',
  },
});
