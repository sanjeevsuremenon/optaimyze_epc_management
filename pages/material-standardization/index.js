import React, { useState } from 'react';
import Papa from 'papaparse';
import { OpenAI } from 'openai';
import styles from './MaterialStandardization.module.css';

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
    <>
    <div className={styles.container}>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"></div>
      <h1 className={styles.title}>Material Description Standardization</h1>

      <div className={styles.mainGrid}>
        <div className={styles.templateSection}>
          <h2>Example Descriptions</h2>
          <div className={styles.templateFields}>
            <div className={styles.field}>
              <label>Primary Characteristic Examples</label>
              <textarea
                value={templateFields.primary}
                onChange={(e) => setTemplateFields(prev => ({...prev, primary: e.target.value}))}
                placeholder="e.g., GASKET, SEAL, O-RING"
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label>Secondary Characteristic Examples</label>
              <textarea
                value={templateFields.secondary}
                onChange={(e) => setTemplateFields(prev => ({...prev, secondary: e.target.value}))}
                placeholder="e.g., 2 INCH 300#, 3 INCH 600#"
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label>Tertiary Characteristic Examples</label>
              <textarea
                value={templateFields.tertiary}
                onChange={(e) => setTemplateFields(prev => ({...prev, tertiary: e.target.value}))}
                placeholder="e.g., SPIRAL WOUND SS316, SW SS304"
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label>Other Specification Examples</label>
              <textarea
                value={templateFields.other}
                onChange={(e) => setTemplateFields(prev => ({...prev, other: e.target.value}))}
                placeholder="e.g., RING JOINT, RTJ"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className={styles.transformationsSection}>
          <h2>Example Transformations</h2>
          <div className={styles.transformationsGrid}>
            {transformations.map((transformation, index) => (
              <div key={index} className={styles.transformationRow}>
                <div className={styles.transformationFields}>
                  <div className={styles.field}>
                    <label>Input Example</label>
                    <textarea
                      value={transformation.input}
                      onChange={(e) => updateTransformation(index, 'input', e.target.value)}
                      placeholder="e.g., spiral wound gasket, 2 inch 300#, ss316"
                      rows={2}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Output Example</label>
                    <textarea
                      value={transformation.output}
                      onChange={(e) => updateTransformation(index, 'output', e.target.value)}
                      placeholder="e.g., GASKET 2&quot; 300# SW SS316"
                      rows={2}
                    />
                  </div>
                  <button
                    onClick={() => removeTransformation(index)}
                    className={styles.removeButton}
                    disabled={transformations.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addTransformation}
            className={styles.addButton}
          >
            Add Example
          </button>
        </div>

        <div className={styles.uploadSection}>
          <h2>Upload Raw Materials File</h2>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setUploadedFile(e.target.files[0])}
            className={styles.fileInput}
          />
        </div>
      </div>

      <button
        onClick={handleProcess}
        className={styles.processButton}
        disabled={isProcessing || !uploadedFile}
      >
        {isProcessing ? 'Processing...' : 'Process Materials'}
      </button>

      {isProcessing && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{width: `${progress}%`}}
          />
          <span>{progress}%</span>
        </div>
      )}

      <div className={styles.resultsContainer}>
        <h2>Processing Results</h2>
        <table className={styles.resultsTable}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Original Description</th>
              <th>Standardized Description</th>
            </tr>
          </thead>
          <tbody>
            {visibleResults.map((result, index) => (
              <tr 
                key={index}
                className={`${styles.resultRow} ${styles.fadeIn}`}
              >
                <td className={styles.statusCell}>
                  {result.type === 'characteristic_notavailable' 
                    ? 'Primary Char Not Available'
                    : result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                </td>
                <td>{result.material.originalDescription}</td>
                <td>{result.material.standardDescription || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.summarySection}>
        {Object.entries(results).map(([type, materials]) => (
          materials.length > 0 && (
            <div key={type} className={styles.summaryItem}>
              <span className={styles.summaryLabel}>
                {type === 'characteristic_notavailable' 
                  ? 'Missing Primary Characteristic'
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
              <span className={styles.summaryCount}>
                {materials.length}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
    {/* <FooterComponent className="mt-32" /> */}
    </>
  );
}