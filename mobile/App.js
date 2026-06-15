import React, { useMemo, useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, View, StyleSheet } from 'react-native';
import { login, logout, getProfile } from './src/services/authApi';

export default function App() {
  const [email, setEmail] = useState('customer@bank.local');
  const [password, setPassword] = useState('CustomerPassword123!');
  const [status, setStatus] = useState('Not authenticated');

  const canSubmit = useMemo(() => email.length > 0 && password.length >= 12, [email, password]);

  const onLogin = async () => {
    try {
      const auth = await login({ email, password });
      const profile = await getProfile();
      setStatus(`Authenticated as ${profile.fullName} (${auth.user.role})`);
    } catch {
      setStatus('Login failed');
    }
  };

  const onLogout = async () => {
    try {
      await logout();
      setStatus('Logged out');
    } catch {
      setStatus('Logout failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Banking Application</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
      />
      <View style={styles.buttonGroup}>
        <Button title="Login" disabled={!canSubmit} onPress={onLogin} />
      </View>
      <View style={styles.buttonGroup}>
        <Button title="Logout" color="#b00020" onPress={onLogout} />
      </View>
      <Text style={styles.status}>{status}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    marginBottom: 24,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  buttonGroup: {
    marginTop: 8,
  },
  status: {
    marginTop: 24,
    fontSize: 16,
  },
});
