export function DocumentDemo() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 sm:rounded-2xl">
      <div className="border-b border-zinc-800 px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="text-sm font-medium text-zinc-100">Document intelligence</p>
        <p className="text-xs leading-relaxed text-zinc-400">
          Upload PDFs, slides, and transcripts — Aproko parses, indexes, and cites them in chat.
        </p>
      </div>
      <div className="grid gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Library</p>
          <div className="mt-3 space-y-2 text-xs sm:text-sm">
            {[
              'OOP Lecture Notes.pdf',
              'Research Paper Draft.docx',
              'Team Meeting Transcript.txt',
            ].map((file) => (
              <p
                className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300"
                key={file}
              >
                {file}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Aproko Chat</p>
          <div className="mt-3 space-y-2 text-xs sm:text-sm">
            <p className="ml-auto max-w-[90%] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-300">
              What is this document about?
            </p>
            <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 leading-relaxed text-zinc-400">
              The speaker introduces object-oriented programming — classes as blueprints, objects as
              instances, and inheritance for reuse. Sources: OOP Lecture Notes.pdf (p. 2–4).
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['What did they say?', 'Summarize', 'Create flashcards'].map((action) => (
                <span
                  className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 sm:text-xs"
                  key={action}
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
