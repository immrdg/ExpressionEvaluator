import React, { useState } from 'react';
import { AlertCircle, Send, Code2, X, Search, Variable } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';

interface EvaluationResult {
  result: string;
  error?: string;
}

type InputType = 'text' | 'null';

function App() {
  const [expression, setExpression] = useState('');
  const [keys, setKeys] = useState<string[]>([]);
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [inputTypes, setInputTypes] = useState<Record<string, InputType>>({});
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const parseExpression = (expr: string) => {
    const matches = expr.match(/get\(['"](.*?)['"]\)/g) || [];
    const extractedKeys = matches.map(match => 
      match.replace(/get\(['"](.*)['"].*/, '$1')
    );
    const uniqueKeys = [...new Set(extractedKeys)];
    setKeys(uniqueKeys);
    
    const newKeyValues = { ...keyValues };
    const newInputTypes = { ...inputTypes };
    uniqueKeys.forEach(key => {
      if (!newKeyValues[key]) newKeyValues[key] = '';
      if (!newInputTypes[key]) newInputTypes[key] = 'text';
    });
    setKeyValues(newKeyValues);
    setInputTypes(newInputTypes);
  };

  const handleExpressionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newExpression = e.target.value;
    setExpression(newExpression);
    parseExpression(newExpression);
  };

  const handleKeyValueChange = (key: string, value: string) => {
    setKeyValues(prev => ({ ...prev, [key]: value }));
  };

  const handleInputTypeChange = (key: string, type: InputType) => {
    setInputTypes(prev => ({ ...prev, [key]: type }));
    if (type === 'null') {
      setKeyValues(prev => ({ ...prev, [key]: 'null' }));
    } else {
      setKeyValues(prev => ({ ...prev, [key]: '' }));
    }
  };

  const clearKey = (key: string) => {
    const newKeyValues = { ...keyValues };
    const newInputTypes = { ...inputTypes };
    delete newKeyValues[key];
    delete newInputTypes[key];
    setKeyValues(newKeyValues);
    setInputTypes(newInputTypes);
    setKeys(keys.filter(k => k !== key));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expression,
          keys: Object.fromEntries(
            Object.entries(keyValues).map(([key, value]) => [
              key,
              inputTypes[key] === 'null' ? null : value
            ])
          ),
        }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        result: '',
        error: 'Failed to connect to the server'+error,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredKeys = keys.filter(key => 
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <Code2 className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Spring Expression Evaluator</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Enter a SpEL expression and provide values for evaluation. The evaluator will automatically detect required keys from your expression.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-gray-100">
            <div className="space-y-2">
              <label htmlFor="expression" className="block text-sm font-medium text-gray-700">
                SpEL Expression
              </label>
              <div className="relative">
                <textarea
                  id="expression"
                  value={expression}
                  onChange={handleExpressionChange}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  placeholder="Example: get('city').equals('London') ? get('city').toUpperCase() : 'Not London'"
                />
              </div>
              <p className="text-xs text-gray-500">
                Use get('key') to reference values. The evaluator will automatically create input fields for each key.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || keys.length === 0 || !expression.trim()}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Evaluating...
                </div>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Evaluate Expression
                </>
              )}
            </button>

            {result && (
              <div className={`mt-4 p-4 rounded-lg border ${
                result.error 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                {result.error ? (
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Evaluation Error</h3>
                      <p className="mt-1 text-sm text-red-700">{result.error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <div className="w-full">
                      <h3 className="text-sm font-medium text-green-800">Result</h3>
                      <div className="mt-1 text-sm text-green-700 font-mono bg-green-100 p-3 rounded">
                        {result.result}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            {keys.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Variable className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Variable Values</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter values for the variables in your expression or set them as null
                    </p>
                  </div>
                </div>

                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search variables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                  {filteredKeys.map(key => (
                    <div key={key} className="relative group bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {key}
                      </label>
                      <div className="flex gap-3">
                        <Select
                          value={inputTypes[key]}
                          onValueChange={(value: InputType) => handleInputTypeChange(key, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text Input</SelectItem>
                            <SelectItem value="null">Null</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {inputTypes[key] === 'text' ? (
                          <input
                            type="text"
                            value={keyValues[key] || ''}
                            onChange={(e) => handleKeyValueChange(key, e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder={`Enter value for ${key}`}
                          />
                        ) : (
                          <div className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500">
                            null
                          </div>
                        )}
                        
                        <button
                          onClick={() => clearKey(key)}
                          className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No variables detected in the expression</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Try example expressions like:</p>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">get('city').equals('London') ? get('city').toUpperCase() : 'Not London'</code>
        </div>
      </div>
    </div>
  );
}

export default App;