export default function SetupRequired() {
  return (
    <div className="max-w-2xl mx-auto py-20 px-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Setup Required</h1>
      <p className="text-gray-400 mb-8">
        Add your API keys to <code className="text-purple-400">.env.local</code>{" "}
        before running Spott. Copy <code className="text-purple-400">.env.example</code>{" "}
        and fill in values from Clerk, Convex, Gemini, and Unsplash.
      </p>
      <ol className="text-left text-gray-300 space-y-3 mb-10 list-decimal list-inside">
        <li>
          Run <code className="text-purple-400">npm run convex:dev</code> to set up
          Convex
        </li>
        <li>
          Add Clerk keys from{" "}
          <a
            href="https://dashboard.clerk.com"
            className="text-purple-400 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            dashboard.clerk.com
          </a>
        </li>
        <li>
          Add Gemini and Unsplash keys (see README.md)
        </li>
        <li>
          Restart with <code className="text-purple-400">npm run dev</code>
        </li>
      </ol>
      <p className="text-sm text-gray-500">
        Full instructions are in <code className="text-purple-400">README.md</code>.
      </p>
    </div>
  );
}
