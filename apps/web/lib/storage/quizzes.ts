import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export type Quiz = {
  id: string;
  workspaceId: string;
  title: string;
  sourceNoteId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuizQuestion = {
  id: string;
  workspaceId: string;
  quizId: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuizAttempt = {
  id: string;
  workspaceId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  createdAt: string;
};

export type QuizAnswerInput = {
  questionId: string;
  selectedOptionIndex: number;
};

type DbQuizRow = {
  id: string;
  workspace_id: string;
  title: string;
  source_note_id: string | null;
  created_at: string;
  updated_at: string;
};

type DbQuizQuestionRow = {
  id: string;
  workspace_id: string;
  quiz_id: string;
  prompt: string;
  options: string[] | null;
  correct_option_index: number;
  explanation: string | null;
  created_at: string;
  updated_at: string;
};

type DbQuizAttemptRow = {
  id: string;
  workspace_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  created_at: string;
};

function toQuiz(row: DbQuizRow): Quiz {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    sourceNoteId: row.source_note_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toQuizQuestion(row: DbQuizQuestionRow): QuizQuestion {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    quizId: row.quiz_id,
    prompt: row.prompt,
    options: row.options ?? [],
    correctOptionIndex: row.correct_option_index,
    explanation: row.explanation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toQuizAttempt(row: DbQuizAttemptRow): QuizAttempt {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    quizId: row.quiz_id,
    score: row.score,
    totalQuestions: row.total_questions,
    createdAt: row.created_at,
  };
}

export async function listQuizzes(workspaceId: string): Promise<Quiz[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('quizzes')
    .select('id, workspace_id, title, source_note_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('Unable to list quizzes.', error.message);
    return [];
  }

  return ((data ?? []) as DbQuizRow[]).map(toQuiz);
}

export async function createQuiz(
  workspaceId: string,
  titleRaw: string,
  sourceNoteId?: string | null,
): Promise<Quiz | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const title = titleRaw.trim() || 'Untitled quiz';
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      workspace_id: workspaceId,
      title,
      source_note_id: sourceNoteId ?? null,
    })
    .select('id, workspace_id, title, source_note_id, created_at, updated_at')
    .single();

  if (error || !data) {
    console.warn('Unable to create quiz.', error?.message ?? 'unknown_error');
    return null;
  }

  return toQuiz(data as DbQuizRow);
}

export async function getQuizById(workspaceId: string, quizId: string): Promise<Quiz | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('quizzes')
    .select('id, workspace_id, title, source_note_id, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('id', quizId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toQuiz(data as DbQuizRow);
}

export async function listQuizQuestions(
  workspaceId: string,
  quizId: string,
): Promise<QuizQuestion[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('quiz_questions')
    .select(
      'id, workspace_id, quiz_id, prompt, options, correct_option_index, explanation, created_at, updated_at',
    )
    .eq('workspace_id', workspaceId)
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Unable to list quiz questions.', error.message);
    return [];
  }

  return ((data ?? []) as DbQuizQuestionRow[]).map(toQuizQuestion);
}

export async function createQuizQuestion(
  workspaceId: string,
  quizId: string,
  promptRaw: string,
  options: string[],
  correctOptionIndex: number,
  explanation?: string | null,
): Promise<QuizQuestion | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const prompt = promptRaw.trim();
  const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);
  if (
    !prompt ||
    cleanedOptions.length < 2 ||
    correctOptionIndex < 0 ||
    correctOptionIndex >= cleanedOptions.length
  ) {
    return null;
  }

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      workspace_id: workspaceId,
      quiz_id: quizId,
      prompt,
      options: cleanedOptions,
      correct_option_index: correctOptionIndex,
      explanation: explanation ?? null,
    })
    .select(
      'id, workspace_id, quiz_id, prompt, options, correct_option_index, explanation, created_at, updated_at',
    )
    .single();

  if (error || !data) {
    console.warn('Unable to create quiz question.', error?.message ?? 'unknown_error');
    return null;
  }

  return toQuizQuestion(data as DbQuizQuestionRow);
}

export async function createQuizAttempt(
  workspaceId: string,
  quizId: string,
  answers: QuizAnswerInput[],
): Promise<QuizAttempt | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const questions = await listQuizQuestions(workspaceId, quizId);
  if (!questions.length) {
    return null;
  }

  const answerMap = new Map<string, number>();
  for (const answer of answers) {
    answerMap.set(answer.questionId, answer.selectedOptionIndex);
  }

  let score = 0;
  for (const question of questions) {
    if (answerMap.get(question.id) === question.correctOptionIndex) {
      score += 1;
    }
  }

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      workspace_id: workspaceId,
      quiz_id: quizId,
      score,
      total_questions: questions.length,
    })
    .select('id, workspace_id, quiz_id, score, total_questions, created_at')
    .single();

  if (error || !data) {
    console.warn('Unable to create quiz attempt.', error?.message ?? 'unknown_error');
    return null;
  }

  const attemptId = (data as DbQuizAttemptRow).id;
  for (const answer of answers) {
    await supabase.from('quiz_answers').insert({
      workspace_id: workspaceId,
      quiz_id: quizId,
      attempt_id: attemptId,
      question_id: answer.questionId,
      selected_option_index: answer.selectedOptionIndex,
    });
  }

  return toQuizAttempt(data as DbQuizAttemptRow);
}

export async function listQuizAttempts(
  workspaceId: string,
  quizId: string,
): Promise<QuizAttempt[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('id, workspace_id, quiz_id, score, total_questions, created_at')
    .eq('workspace_id', workspaceId)
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.warn('Unable to list quiz attempts.', error.message);
    return [];
  }

  return ((data ?? []) as DbQuizAttemptRow[]).map(toQuizAttempt);
}
