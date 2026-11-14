# Mobile

O app Android é o mesmo `frontend-react/` empacotado pelo Capacitor
(`capacitor.config.json`, `appId` `com.alexnascimento.curricula`). Ele chama a API
hospedada no Render; o servidor precisa estar atualizado para o app novo funcionar
igual à web.

```
frontend-react (React/Vite) → www/ → Capacitor (cap sync) → android/ → APK/AAB
```

## Atualizar o app

1. **Suba a versão** em `android/app/build.gradle`: aumente `versionCode` (inteiro,
   sempre maior que o anterior — a Play Store e o Android exigem) e ajuste
   `versionName` (texto mostrado ao usuário). Versão atual: `versionCode 2`,
   `versionName "1.1"`.
2. **Gere o frontend e sincronize** (na raiz do repositório):
   ```powershell
   npm run android
   ```
   Isso roda `npm --prefix frontend-react run build:android` (gera `www/`) e
   `cap sync android`.
3. **Gere o app:**
   - Teste em aparelho físico: `npm run android:open` abre o Android Studio; conecte o
     celular (depuração USB) e clique em *Run*. O emulador pode falhar em algumas máquinas.
   - APK de depuração por linha de comando:
     `cd android; .\gradlew assembleDebug` — o arquivo sai em
     `android\app\build\outputs\apk\debug\app-debug.apk`.
   - Para publicar (Play Store), gere um pacote assinado no Android Studio:
     *Build → Generate Signed App Bundle / APK*. A chave de assinatura (keystore) e
     suas senhas **não** ficam no repositório; guarde uma cópia segura, porque sem ela
     não dá para atualizar o app publicado.

## Conferir antes de distribuir

- O servidor do Render está com o deploy da `main` mais recente.
- Login (e-mail e Google), geração do PDF e salvamento de currículos funcionam no
  aparelho físico.
