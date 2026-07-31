import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { authService } from './services/auth';
import type { AreteUser } from './services/types';

type ViewName = 'login' | 'register' | 'recover';

export default function App() {
  const [view, setView] = useState<ViewName>('login');
  const [user, setUser] = useState<AreteUser | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [recoveryUserId, setRecoveryUserId] = useState('');
  const [recoverySecret, setRecoverySecret] = useState('');

  useEffect(() => {
    if (!authService.configured) return;
    authService.current().then(setUser).catch(() => undefined);
    const consumeUrl = (url: string | null) => {
      if (!url) return;
      const parsed = new URL(url);
      const userId = parsed.searchParams.get('userId') || '';
      const secret = parsed.searchParams.get('secret') || '';
      const mode = parsed.searchParams.get('mode') || '';
      if (!userId || !secret) return;
      if (mode === 'verify') {
        void run(async () => {
          await authService.completeVerification(userId, secret);
          setMessage('Correo confirmado correctamente. Tu cuenta Arete ya está verificada.');
        });
        return;
      }
      setRecoveryUserId(userId);
      setRecoverySecret(secret);
      setView('recover');
      setMessage('Enlace verificado. Escribe y confirma tu nueva contraseña.');
    };
    void Linking.getInitialURL().then(consumeUrl);
    const subscription = Linking.addEventListener('url', (event) => consumeUrl(event.url));
    return () => subscription.remove();
  }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try { await action(); } catch (error: any) {
      setMessage(error?.message || 'No pudimos completar la solicitud. Inténtalo nuevamente.');
    } finally { setBusy(false); }
  }

  async function submit() {
    if (!authService.configured) {
      setMessage('Agrega los datos públicos de Appwrite en apps/arete-native/.env.');
      return;
    }
    if (!email || !password) { setMessage('Completa tu correo y contraseña.'); return; }
    if (view === 'register' && (!name || !username || password !== confirm)) {
      setMessage('Completa nombre, usuario y confirma la misma contraseña.'); return;
    }
    await run(async () => {
      const next = view === 'register'
        ? await authService.register({ name, username, email: email.toLowerCase(), password })
        : await authService.login(email.toLowerCase(), password);
      setUser(next);
      setMessage('');
    });
  }

  if (user) {
    const webUrl = process.env.EXPO_PUBLIC_ARETE_WEB_URL || 'http://localhost:3001';
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" />
      <View style={styles.accountCard}>
        <Text style={styles.kicker}>ARETE | CUENTA SEGURA</Text>
        <Text style={styles.title}>Hola, {user.name || user.username}</Text>
        <Text style={styles.copy}>{user.email}</Text>
        <Text style={styles.copy}>La base React Native y la sesión Appwrite ya están listas para Android, iOS y web.</Text>
        <Action label="Abrir expediente clínico web" onPress={() => void Linking.openURL(webUrl)} />
        <Action secondary label="Cerrar sesión" onPress={() => void run(async () => { await authService.logout(); setUser(null); })} />
      </View>
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.kicker}>ARETE | ACCESO SEGURO</Text>
        <Text style={styles.title}>Tu consultorio, en todos tus dispositivos</Text>
        <Text style={styles.copy}>Accede con tu correo. Tu nombre de usuario identifica tu perfil dentro de Arete.</Text>
        <View style={styles.tabs}>
          {(['login', 'register', 'recover'] as ViewName[]).map((item) =>
            <Pressable key={item} onPress={() => { setView(item); setMessage(''); }} style={[styles.tab, view === item && styles.tabActive]}>
              <Text style={styles.tabText}>{item === 'login' ? 'Entrar' : item === 'register' ? 'Registro' : 'Recuperar'}</Text>
            </Pressable>)}
        </View>
        {view === 'register' && <><Field label="Nombre completo" value={name} onChangeText={setName} />
          <Field label="Nombre de usuario" value={username} onChangeText={setUsername} autoCapitalize="none" /></>}
        <Field label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        {(view !== 'recover' || !!recoverySecret) && <Field label={view === 'recover' ? 'Nueva contraseña' : 'Contraseña'} value={password} onChangeText={setPassword} secureTextEntry />}
        {view === 'register' && <Field label="Confirmar contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry />}
        {view === 'recover' && !!recoverySecret && <Field label="Confirmar nueva contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry />}
        {view === 'recover'
          ? recoverySecret
            ? <Action disabled={busy} label={busy ? 'Actualizando...' : 'Guardar nueva contraseña'} onPress={() => void run(async () => {
                if (!password || password !== confirm) throw new Error('Escribe y confirma la misma contraseña.');
                await authService.completeRecovery(recoveryUserId, recoverySecret, password);
                setRecoveryUserId(''); setRecoverySecret(''); setPassword(''); setConfirm(''); setView('login');
                setMessage('Tu contraseña fue actualizada. Ya puedes iniciar sesión.');
              })} />
            : <Action disabled={busy} label={busy ? 'Enviando...' : 'Enviar enlace seguro'} onPress={() => void run(async () => {
                await authService.requestRecovery(email.toLowerCase());
                setMessage('Te enviamos un enlace seguro de Arete. Revisa también correo no deseado.');
              })} />
          : <Action disabled={busy} label={busy ? 'Procesando...' : view === 'register' ? 'Crear cuenta' : 'Iniciar sesión'} onPress={() => void submit()} />}
        {!!message && <Text style={styles.message}>{message}</Text>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function Field(props: any) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="#8b8174" /></View>;
}
function Action({ label, secondary, ...props }: any) {
  return <Pressable {...props} style={[styles.button, secondary && styles.buttonSecondary, props.disabled && styles.disabled]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f2e9' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 650, alignSelf: 'center', backgroundColor: '#fffdf9', borderColor: '#d7c3a7', borderWidth: 1, borderRadius: 24, padding: 24 },
  accountCard: { margin: 20, maxWidth: 650, width: '90%', alignSelf: 'center', backgroundColor: '#fffdf9', borderRadius: 24, padding: 28 },
  kicker: { color: '#8f6d3d', fontWeight: '800', letterSpacing: 1 },
  title: { color: '#30291f', fontSize: 29, fontWeight: '800', marginTop: 8 },
  copy: { color: '#746b60', fontSize: 16, lineHeight: 24, marginTop: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 20, flexWrap: 'wrap' },
  tab: { backgroundColor: '#dce4ea', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 11 },
  tabActive: { backgroundColor: '#efd09d' }, tabText: { color: '#33291e', fontWeight: '700' },
  field: { marginBottom: 14 }, label: { color: '#665b4e', fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9bea0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: '#2c2823', fontSize: 16 },
  button: { backgroundColor: '#1f6367', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 10 },
  buttonSecondary: { backgroundColor: '#73828c' }, disabled: { opacity: 0.55 },
  buttonText: { color: '#fff', fontWeight: '800' }, message: { color: '#9b342d', fontWeight: '700', marginTop: 14 },
});
