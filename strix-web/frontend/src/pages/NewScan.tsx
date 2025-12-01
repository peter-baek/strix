import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createScan } from '../api/client';
import type { Target, TargetType } from '../types';

interface TargetInput extends Target {
  id: string;
}

const TARGET_TYPES: { value: TargetType; label: string; icon: string; placeholder: string }[] = [
  { value: 'repository', label: 'Repository', icon: '🔗', placeholder: 'https://github.com/org/repo' },
  { value: 'local_code', label: 'Local Code', icon: '📁', placeholder: '/path/to/project' },
  { value: 'web_application', label: 'Web Application', icon: '🌐', placeholder: 'https://target-app.com' },
  { value: 'ip_address', label: 'IP Address', icon: '🖥️', placeholder: '192.168.1.100' },
];

export default function NewScan() {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<TargetInput[]>([
    { id: '1', type: 'local_code', value: './' },
  ]);
  const [instructions, setInstructions] = useState('');
  const [llmModel, setLlmModel] = useState('openai/gpt-4o');
  const [maxIterations, setMaxIterations] = useState(300);
  const [scanName, setScanName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTarget = () => {
    setTargets([
      ...targets,
      { id: Date.now().toString(), type: 'local_code', value: '' },
    ]);
  };

  const removeTarget = (id: string) => {
    if (targets.length > 1) {
      setTargets(targets.filter((t) => t.id !== id));
    }
  };

  const updateTarget = (id: string, field: keyof Target, value: string) => {
    setTargets(
      targets.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate targets
    const validTargets = targets.filter((t) => t.value.trim());
    if (validTargets.length === 0) {
      setError('Please add at least one target');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createScan({
        targets: validTargets.map(({ type, value }) => ({ type, value })),
        user_instructions: instructions,
        llm_model: llmModel,
        max_iterations: maxIterations,
        name: scanName || undefined,
      });

      navigate(`/scan/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <span className="text-5xl">🦉</span>
        <h1 className="text-2xl font-bold text-accent-green mt-4">STRIX</h1>
        <p className="text-strix-text-secondary mt-2">
          Open-source AI Hackers for your Apps
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Targets */}
        <div className="bg-strix-surface border border-strix-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-strix-text-secondary">Targets</h2>
            <button
              type="button"
              onClick={addTarget}
              className="text-sm text-accent-green hover:text-accent-green/80 transition-colors"
            >
              + Add Target
            </button>
          </div>

          <div className="space-y-3">
            {targets.map((target) => {
              const typeConfig = TARGET_TYPES.find((t) => t.value === target.type);
              return (
                <div key={target.id} className="flex items-start gap-2">
                  <select
                    value={target.type}
                    onChange={(e) => updateTarget(target.id, 'type', e.target.value)}
                    className="bg-strix-bg border border-strix-border rounded px-3 py-2 text-sm text-strix-text-primary focus:border-accent-green outline-none"
                  >
                    {TARGET_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={target.value}
                    onChange={(e) => updateTarget(target.id, 'value', e.target.value)}
                    placeholder={typeConfig?.placeholder}
                    className="flex-1 bg-strix-bg border border-strix-border rounded px-3 py-2 text-sm text-strix-text-primary placeholder:text-strix-text-muted focus:border-accent-green outline-none"
                  />
                  {targets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTarget(target.id)}
                      className="p-2 text-strix-text-muted hover:text-accent-red transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-strix-surface border border-strix-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-strix-text-secondary mb-3">
            Special Instructions (Optional)
          </h2>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Focus on business logic flaws and IDOR vulnerabilities..."
            rows={3}
            className="w-full bg-strix-bg border border-strix-border rounded px-3 py-2 text-sm text-strix-text-primary placeholder:text-strix-text-muted focus:border-accent-green outline-none resize-none"
          />
        </div>

        {/* Configuration */}
        <div className="bg-strix-surface border border-strix-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-strix-text-secondary mb-3">
            Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-strix-text-muted mb-1">Scan Name</label>
              <input
                type="text"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                placeholder="my-security-scan"
                className="w-full bg-strix-bg border border-strix-border rounded px-3 py-2 text-sm text-strix-text-primary placeholder:text-strix-text-muted focus:border-accent-green outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-strix-text-muted mb-1">LLM Model</label>
              <select
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                className="w-full bg-strix-bg border border-strix-border rounded px-3 py-2 text-sm text-strix-text-primary focus:border-accent-green outline-none"
              >
                <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                <option value="openai/gpt-4">OpenAI GPT-4</option>
                <option value="anthropic/claude-sonnet-4-5">Claude Sonnet 4.5</option>
                <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-strix-text-muted mb-1">Max Iterations</label>
              <input
                type="number"
                value={maxIterations}
                onChange={(e) => setMaxIterations(parseInt(e.target.value) || 300)}
                min={10}
                max={1000}
                className="w-full bg-strix-bg border border-strix-border rounded px-3 py-2 text-sm text-strix-text-primary focus:border-accent-green outline-none"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-accent-red/20 border border-accent-red/50 rounded-lg p-3 text-sm text-accent-red">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent-green hover:bg-accent-green/90 disabled:bg-accent-green/50 text-strix-bg font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">🦉</span>
              Starting Scan...
            </>
          ) : (
            <>
              🚀 Start Security Scan
            </>
          )}
        </button>
      </form>
    </div>
  );
}
