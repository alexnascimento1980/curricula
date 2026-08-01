import type { User } from "@supabase/supabase-js";
import { type ReactNode, useEffect, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";
import { AuthContext, type AuthContextValue } from "./AuthContextObject";

// Esquema de URL customizado que o Android/iOS usa pra "devolver" o
// controle ao app depois do login OAuth (configurado no
// AndroidManifest.xml e, futuramente, no Info.plist do iOS).
const OAUTH_CALLBACK_URL = "com.alexnascimento.curricula://auth-callback";

// Depois do login via OAuth (Google), o Supabase redireciona de volta com
// os tokens de sessão expostos no #hash da URL. O client já lê e usa esses
// tokens automaticamente, mas eles continuam visíveis na barra de
// endereço até serem removidos manualmente — sensível, porque qualquer
// pessoa que veja essa URL (histórico, print, link compartilhado) teria
// acesso à sessão.
function limparTokenDaURL() {
  if (window.location.hash) {
    const urlLimpa =
      window.location.origin +
      window.location.pathname +
      window.location.search;
    window.history.replaceState({}, document.title, urlLimpa);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [carregandoSessaoInicial, setCarregandoSessaoInicial] =
    useState(true);
  const [emRecuperacaoDeSenha, setEmRecuperacaoDeSenha] = useState(false);
  const [emailParaRecuperacao, setEmailParaRecuperacao] = useState("");

  useEffect(() => {
    let userIdAtual: string | null = null;

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      userIdAtual = session?.user?.id ?? null;
      setUser(session?.user ?? null);
      setCarregandoSessaoInicial(false);
      limparTokenDaURL();
    });

    const { data: assinatura } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          limparTokenDaURL();
          setEmailParaRecuperacao(session?.user?.email ?? "");
          setEmRecuperacaoDeSenha(true);
          return;
        }

        // O Supabase dispara um evento (ex: INITIAL_SESSION) imediatamente
        // ao registrar este listener, repetindo a mesma sessão que já
        // processamos acima via getSession(). Sem essa checagem, quem
        // consome este contexto reagiria duas vezes à mesma mudança de
        // sessão.
        const novoUserId = session?.user?.id ?? null;
        if (novoUserId === userIdAtual) return;
        userIdAtual = novoUserId;
        setUser(session?.user ?? null);
        limparTokenDaURL();
      },
    );

    return () => assinatura.subscription.unsubscribe();
  }, []);

  // Fluxo OAuth nativo (Android/iOS via Capacitor) — só faz algo quando
  // rodando dentro do app empacotado; em navegador comum, isNativePlatform()
  // não existe/retorna false e este efeito não faz nada.
  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform()) return;

    let handleRemovido = false;
    let handle: { remove: () => Promise<void> } | undefined;

    window.Capacitor.Plugins.App.addListener(
      "appUrlOpen",
      async (evento) => {
        if (!evento.url || !evento.url.startsWith(OAUTH_CALLBACK_URL)) return;

        await window.Capacitor?.Plugins.Browser.close().catch(() => {});

        const hash = evento.url.split("#")[1] ?? "";
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const ehRecuperacaoSenha = params.get("type") === "recovery";

        if (access_token && refresh_token) {
          const { error } = await supabaseClient.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) return;

          // setSession() feito manualmente aqui não dispara o evento
          // automático PASSWORD_RECOVERY do Supabase (esse evento só ocorre
          // quando o próprio client detecta e interpreta a URL sozinho) —
          // por isso checamos o parâmetro "type" e abrimos o fluxo na mão.
          if (ehRecuperacaoSenha) {
            setEmailParaRecuperacao("");
            setEmRecuperacaoDeSenha(true);
          }
        }
      },
    ).then((h) => {
      // O efeito pode já ter sido desmontado antes da Promise resolver
      // (ex: hot reload) — se isso aconteceu, remove na hora em vez de
      // guardar um handle órfão.
      if (handleRemovido) {
        h.remove();
      } else {
        handle = h;
      }
    });

    return () => {
      handleRemovido = true;
      handle?.remove();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    carregandoSessaoInicial,
    emRecuperacaoDeSenha,
    emailParaRecuperacao,
    fecharFluxoDeRecuperacao: () => setEmRecuperacaoDeSenha(false),

    login: async (email, password) => {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },

    cadastrar: async (email, password) => {
      const { error } = await supabaseClient.auth.signUp({ email, password });
      return { error };
    },

    loginComGoogle: async () => {
      const isNative = window.Capacitor?.isNativePlatform() ?? false;

      if (isNative) {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: OAUTH_CALLBACK_URL,
            skipBrowserRedirect: true,
          },
        });
        if (error) return { error };
        await window.Capacitor?.Plugins.Browser.open({ url: data.url });
        return { error: null };
      }

      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      return { error };
    },

    logout: async () => {
      await supabaseClient.auth.signOut();
    },

    enviarLinkRecuperacao: async (email) => {
      const isNative = window.Capacitor?.isNativePlatform() ?? false;
      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        { redirectTo: isNative ? OAUTH_CALLBACK_URL : window.location.origin },
      );
      return { error };
    },

    salvarNovaSenha: async (novaSenha) => {
      const { error } = await supabaseClient.auth.updateUser({
        password: novaSenha,
      });
      if (!error) setEmRecuperacaoDeSenha(false);
      return { error };
    },
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
