import React, { useState } from 'react';
import Papa from 'papaparse';
import { OpenAI } from 'openai';
import { Sparkles, UploadCloud, Plus, Trash2, CheckCircle2, AlertCircle, Play, FileSpreadsheet } from 'lucide-react';
import GlassSubPageHero from '../../components/GlassSubPageHero';
import { GlassStyles, Tilt } from '../../components/landing/glass';

function getOpenAIClient() {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured (set OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY in .env)');
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export default function MaterialStandardizationPage() {

  const [templateFields, setTemplateFields] = useState({
    primary: '',
    secondary: '',
    tertiary: '',
    other: ''
  });

  const [uploadedFile, setUploadedFile] = useState(null);

  const [results, setResults] = useState({
    standardized: [],
    oversized: [],
    uncleansed: [],
    characteristic_notavailable: []
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const [progress, setProgress] = useState(0);

  // New state for example transformations
  const [transformations, setTransformations] = useState([
    { 
      input: 'spiral wound gasket, 2 inch 300#, ss316',
      output: 'GASKET 2" 300# SW SS316'
    },
    { 
      input: '2 inch class 300 spiral wound ss316 gasket',
      output: 'GASKET 2" 300# SW SS316'
    }
  ]);

  // Add new state for visible results
  const [visibleResults, setVisibleResults] = useState([]);

  // Function to add new transformation
  const addTransformation = () => {
    setTransformations([...transformations, { input: '', output: '' }]);
  };

  // Function to update transformation
  const updateTransformation = (index, field, value) => {
    const newTransformations = transformations.map((t, i) => {
      if (i === index) {
        return { ...t, [field]: value };
      }
      return t;
    });
    setTransformations(newTransformations);
  };

  // Function to remove transformation
  const removeTransformation = (index) => {
    if (transformations.length > 2) {
      setTransformations(transformations.filter((_, i) => i !== index));
    }
  };

  const processDescriptionWithAI = async (material) => {
    try {
      const originalDesc = material.Description || material.description || material.DESCRIPTION || Object.values(material)[1];
      
      // Create example transformations text from state
      const exampleTransformations = transformations
        .filter(t => t.input && t.output) // Only use complete examples
        .map(t => `Input: "${t.input}"
Output: "${t.output}"`)
        .join('\n\n');
      
      const prompt = `
Task: Standardize material descriptions following specific patterns.

EXAMPLE PATTERNS:
Primary (must be first word): ${templateFields.primary}
Secondary (size/rating): ${templateFields.secondary}
Tertiary (material/type): ${templateFields.tertiary}
Other specs: ${templateFields.other}

If ${templateFields.secondary} has <model> in it, then use the model as the secondary characteristic. if it has <model><partnumber> in it, then use the model & partnumber as the secondary characteristic.

EXAMPLE TRANSFORMATIONS:
${exampleTransformations}

INPUT DESCRIPTION: "${originalDesc}"

RULES:
1. Output must be in UPPERCASE
2. Maximum 40 characters
3. Must follow order: PRIMARY SECONDARY TERTIARY OTHER
4. Must match pattern of examples
5. First word MUST match pattern from Primary examples
6. At least one of Secondary and Tertiary must be present in the description.
7. if cleaned description is more than 40 characters, try retaining primary, secondary, tertiary, and any other specs that are present in the description may be trimmed.
7. If you are not sure that the material can be standardized, output "UNCLEANSED"

Now standardize the input description: "${originalDesc}"

if transformed description is more than 40 characters, output "OVERSIZED"
if you are not finding either 'Secondary' and 'Tertiary' in the description or if you are not sure that the material can be standardized, output "UNCLEANSED"
if primary characteristic is missing, output "CHARACTERISTIC_NOT_AVAILABLE"

Output only the standardized description or one of these keywords: CHARACTERISTIC_NOT_AVAILABLE, OVERSIZED, UNCLEANSED`;

      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a precise material description standardization expert. Output only the standardized description without any additional text or quotes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 60
      });

      // Clean up the AI response
      let result = completion.choices[0].message.content.trim()
        // Remove any "Output:" or "Standardized Description:" prefix
        .replace(/^(Output:|Standardized Description:)\s*/i, '')
        // Remove any surrounding quotes
        .replace(/^["']|["']$/g, '')
        // Remove any extra whitespace
        .trim();

      console.log('Original:', originalDesc);
      console.log('Cleaned AI Response:', result);

      switch (result) {
        case 'CHARACTERISTIC_NOT_AVAILABLE':
          return {
            type: 'characteristic_notavailable',
            material: {
              ...material,
              originalDescription: originalDesc
            }
          };
        case 'OVERSIZED':
          return {
            type: 'oversized',
            material: {
              ...material,
              originalDescription: originalDesc,
              standardDescription: result
            }
          };
        case 'UNCLEANSED':
          return {
            type: 'uncleansed',
            material: {
              ...material,
              originalDescription: originalDesc
            }
          };
        default:
          return {
            type: 'standardized',
            material: {
              ...material,
              originalDescription: originalDesc,
              standardDescription: result
            }
          };
      }
    } catch (error) {
      console.error('AI Processing Error:', error);
      return { type: 'uncleansed', material };
    }
  };

  const handleProcess = async () => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const processed = {
          standardized: [],
          oversized: [],
          uncleansed: [],
          characteristic_notavailable: []
        };

        const batchSize = 3;
        setVisibleResults([]); // Reset visible results

        for (let i = 0; i < results.data.length; i += batchSize) {
          const batch = results.data.slice(i, i + batchSize);
          
          const batchPromises = batch.map(row => 
            processDescriptionWithAI(row)
          );
          
          const batchResults = await Promise.all(batchPromises);
          
          // Update processed results
          batchResults.forEach(({ type, material }) => {
            processed[type].push(material);
          });

          // Update visible results with animation
          setVisibleResults(prev => [...prev, ...batchResults]);
          
          // Update progress
          const currentProgress = Math.round(((i + batchSize) / results.data.length) * 100);
          setProgress(Math.min(currentProgress, 100));
          setResults({...processed});
          
          // Wait for 1 second before next batch
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Generate and download CSV files
        Object.entries(processed).forEach(([type, data]) => {
          if (data.length > 0) {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${templateFields.primary.slice(0, 6)}_${type}_materials.csv`;
            a.click();
          }
        });

        setIsProcessing(false);
        setProgress(100);
      }
    });
  };

  return (
    <div className="app-page min-h-screen font-[Poppins,sans-serif]">
      <GlassStyles />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Glass Sub Page Hero */}
        <GlassSubPageHero
          icon={Sparkles}
          eyebrow="AI Data Engineering"
          title="Material Description Standardization"
          description="Build taxonomy rule heuristics and generate clean, standardized material master catalogs using AI transformation models."
          accent="emerald"
          moduleKey="materials"
        />

        {/* Bento Grid: Rules & Transformations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Characteristic Rules Card */}
          <Tilt glow="emerald" className="bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-app-text flex items-center gap-2">
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                Characteristic Rules
              </h2>
              <p className="text-xs text-app-text-muted mt-1">Specify taxonomy rules and characteristic placeholders.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-app-text-muted mb-1 uppercase tracking-wider">Primary Characteristic (Item/Noun)</label>
                <textarea
                  value={templateFields.primary}
                  onChange={(e) => setTemplateFields(prev => ({...prev, primary: e.target.value}))}
                  placeholder="e.g., GASKET, SEAL, O-RING"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-text-disabled focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-app-text-muted mb-1 uppercase tracking-wider">Secondary Characteristic (Size/Rating/Model)</label>
                <textarea
                  value={templateFields.secondary}
                  onChange={(e) => setTemplateFields(prev => ({...prev, secondary: e.target.value}))}
                  placeholder="e.g., 2 INCH 300#, 3 INCH 600#, <model>"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-text-disabled focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-app-text-muted mb-1 uppercase tracking-wider">Tertiary Characteristic (Material/Type)</label>
                <textarea
                  value={templateFields.tertiary}
                  onChange={(e) => setTemplateFields(prev => ({...prev, tertiary: e.target.value}))}
                  placeholder="e.g., SPIRAL WOUND SS316, SW SS304"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-text-disabled focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-app-text-muted mb-1 uppercase tracking-wider">Other Specifications</label>
                <textarea
                  value={templateFields.other}
                  onChange={(e) => setTemplateFields(prev => ({...prev, other: e.target.value}))}
                  placeholder="e.g., RING JOINT, RTJ"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs text-app-text placeholder:text-app-text-disabled focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>
          </Tilt>

          {/* Example Transformations Builder Card */}
          <Tilt glow="teal" className="bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-app-text flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-teal-500 rounded-full" />
                  Example Transformations
                </h2>
                <p className="text-xs text-app-text-muted mt-1">Provide few-shot examples for the model parser.</p>
              </div>
              <button
                onClick={addTransformation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-surface-muted hover:bg-app-surface border border-app-border text-xs font-semibold text-app-text rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                Add Example
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {transformations.map((transformation, index) => (
                <div key={index} className="p-3.5 rounded-xl border border-app-border bg-app-surface-muted/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-app-text-muted">Example #{index + 1}</span>
                    <button
                      onClick={() => removeTransformation(index)}
                      className="text-app-text-muted hover:text-rose-500 transition-colors p-1 disabled:opacity-30"
                      disabled={transformations.length <= 2}
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-app-text-muted mb-1">Input Text</label>
                    <textarea
                      value={transformation.input}
                      onChange={(e) => updateTransformation(index, 'input', e.target.value)}
                      placeholder="e.g., spiral wound gasket, 2 inch 300#, ss316"
                      rows={1}
                      className="w-full px-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-text-disabled focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-app-text-muted mb-1">Target Output</label>
                    <textarea
                      value={transformation.output}
                      onChange={(e) => updateTransformation(index, 'output', e.target.value)}
                      placeholder='e.g., GASKET 2" 300# SW SS316'
                      rows={1}
                      className="w-full px-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-xs text-app-text placeholder:text-app-text-disabled focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Tilt>
        </div>

        {/* Upload & Run Action Card */}
        <div className="bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-app-text">Upload Raw Materials CSV</h3>
              <p className="text-xs text-app-text-muted mt-0.5">Select a CSV file containing unstandardized material descriptions.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadedFile(e.target.files[0])}
              className="text-xs text-app-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-app-border file:bg-app-surface file:text-xs file:font-semibold file:text-app-text hover:file:bg-app-surface-muted cursor-pointer"
            />
            <button
              onClick={handleProcess}
              disabled={isProcessing || !uploadedFile}
              className="app-btn-primary text-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {isProcessing ? 'Processing Batch...' : 'Process Materials'}
            </button>
          </div>
        </div>

        {/* Processing Progress Bar */}
        {isProcessing && (
          <div className="bg-app-surface/80 border border-app-border rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex justify-between text-xs font-semibold text-app-text">
              <span>Standardizing descriptions...</span>
              <span className="text-emerald-500 font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-app-surface-muted h-3 rounded-full overflow-hidden border border-app-border">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full" 
                style={{width: `${progress}%`}}
              />
            </div>
          </div>
        )}

        {/* Results Summary Bento Cards */}
        {Object.entries(results).some(([_, m]) => m.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(results).map(([type, materials]) => (
              materials.length > 0 && (
                <Tilt
                  key={type}
                  glow={type === 'standardized' ? 'emerald' : type === 'oversized' ? 'amber' : 'rose'}
                  className="p-5 bg-app-surface/80 backdrop-blur-md rounded-2xl border border-app-border shadow-sm flex flex-col justify-between"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-app-text-muted">
                    {type === 'characteristic_notavailable' 
                      ? 'Missing Primary Char' 
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  <p className="text-3xl font-extrabold text-app-text mt-2">
                    {materials.length}
                  </p>
                </Tilt>
              )
            ))}
          </div>
        )}

        {/* Results Live Table */}
        {visibleResults.length > 0 && (
          <div className="bg-app-surface/80 backdrop-blur-md border border-app-border rounded-2xl shadow-sm overflow-hidden space-y-3 p-5">
            <h2 className="text-base font-bold text-app-text flex items-center gap-2">
              <div className="w-1.5 h-5 bg-app-accent rounded-full" />
              Live Processing Stream
            </h2>
            <div className="overflow-x-auto rounded-xl border border-app-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-app-surface-muted text-app-text-secondary uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Original Description</th>
                    <th className="px-4 py-3">Standardized Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border bg-app-surface text-app-text">
                  {visibleResults.map((result, index) => (
                    <tr key={index} className="hover:bg-app-surface-muted/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          result.type === 'standardized'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : result.type === 'oversized'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        }`}>
                          {result.type === 'characteristic_notavailable' 
                            ? 'Primary Char Missing'
                            : result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-app-text-secondary font-mono">{result.material.originalDescription}</td>
                      <td className="px-4 py-3 font-semibold text-app-text">{result.material.standardDescription || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}