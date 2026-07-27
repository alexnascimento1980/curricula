export default [
  {
    // Bibliotecas de terceiros empacotadas localmente (bootstrap,
    // supabase-js) — não é código nosso, não faz sentido lintar.
    ignores: ["frontend/vendor/**"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      indent: ["error", 2]
    }
  }
];
