import { supabaseClient } from "./supabaseClient";
import type { DadosCurriculo } from "../types/curriculo";

export interface ResumoDeCurriculo {
  id: string;
  resume_name: string | null;
  updated_at: string;
}

export async function listarCurriculos(
  userId: string,
): Promise<ResumoDeCurriculo[]> {
  const { data, error } = await supabaseClient
    .from("curriculos")
    .select("id, resume_name, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function buscarIdMaisRecente(
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from("curriculos")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0].id;
}

export async function criarCurriculo(
  userId: string,
  nome: string,
): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from("curriculos")
    .insert({ user_id: userId, resume_name: nome, dados: {} })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao criar currículo:", error);
    return null;
  }
  return data.id;
}

export async function buscarCurriculoPorId(id: string): Promise<{
  nome: string;
  dados: Partial<DadosCurriculo> | null;
} | null> {
  const { data, error } = await supabaseClient
    .from("curriculos")
    .select("dados, resume_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return { nome: data.resume_name || "Sem nome", dados: data.dados };
}

export async function salvarCurriculo(
  id: string,
  dados: DadosCurriculo,
): Promise<{ error: unknown }> {
  const { error } = await supabaseClient
    .from("curriculos")
    .update({ dados, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error };
}

export async function renomearCurriculo(
  id: string,
  nome: string,
): Promise<{ error: unknown }> {
  const { error } = await supabaseClient
    .from("curriculos")
    .update({ resume_name: nome })
    .eq("id", id);
  return { error };
}

export async function excluirCurriculoPorId(
  id: string,
): Promise<{ error: unknown }> {
  const { error } = await supabaseClient
    .from("curriculos")
    .delete()
    .eq("id", id);
  return { error };
}
