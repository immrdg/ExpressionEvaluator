import React, { useState, useRef } from 'react';
import { AlertCircle, Send, Code2, Variable, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { spelMethods, type SpelMethod } from './lib/spel-methods';

interface EvaluationResult {
  result: string;
  error?: string;
}

type InputType = 'text' | 'null';

interface ValidationError {
  message: string;
  position: number;
}

interface SuggestionPosition {
  top: number;
  left: number;
}

function App() {
  const [expression, setExpression] = useState('');
  const [keys, setKeys] = useState<string[]>([]);
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [inputTypes, setInputTypes] = useState<Record<string, InputType>>({});
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SpelMethod[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState<SuggestionPosition>({ top: 0, left: 0 });
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);

  const validateExpression = (expr: string): ValidationError | null => {
    // Check for concatenation within get() parameters
    const invalidConcatInGetRegex = /get\(['"].*?\+.*?['"]\)/;
    if (invalidConcatInGetRegex.test(expr)) {
      return {
        message: "String concatenation is not allowed within get() parameters. Use get() for simple variable names only.",
        position: expr.search(invalidConcatInGetRegex)
      };
    }

    // Check for nested get() calls
    const nestedGetRegex = /get\(['"].*?get\(.*?\).*?\)/;
    if (nestedGetRegex.test(expr)) {
      return {
        message: "Nested get() calls are not allowed. Use separate get() calls and combine them outside.",
        position: expr.search(nestedGetRegex)
      };
    }

    // Check for invalid characters in get() parameters
    const invalidCharsInGetRegex = /get\(['"][^'"\w\d]+['"]\)/;
    if (invalidCharsInGetRegex.test(expr)) {
      return {
        message: "Only alphanumeric characters are allowed in get() parameters.",
        position: expr.search(invalidCharsInGetRegex)
      };
    }

    return null;
  };

  const parseExpression = (expr: string) => {
    const error = validateExpression(expr);
    setValidationError(error);

    if (!error) {
      // Extract only valid get() calls with simple variable names
      const getCallRegex = /get\(['"]([\w\d]+)['"]\)/g;
      const matches = Array.from(expr.matchAll(getCallRegex));
      const extractedKeys = matches.map(match => match[1]);
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
    } else {
      setKeys([]);
      setKeyValues({});
      setInputTypes({});
    }

    setLineCount((expr.match(/\n/g) || []).length + 1);
  };

  const getHighlightedExpression = () => {
    const methodNames = spelMethods.map(m => m.name).join('|');
    return expression.replace(
        new RegExp(`(${methodNames})(\\()|('[^']*')|("[^"]*")|(\\d+)|([()?.:])|(\n)`, 'g'),
        (match, method, bracket, singleQuote, doubleQuote, number, operator, newline) => {
          if (method) return `<span class="method">${method}</span>${bracket}`;
          if (singleQuote || doubleQuote) return `<span class="string">${match}</span>`;
          if (number) return `<span class="number">${match}</span>`;
          if (operator) return `<span class="operator">${match}</span>`;
          if (newline) return '\n';
          return match;
        }
    );
  };

  const updateSuggestionPosition = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const textBeforeCursor = expression.slice(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLineNumber = lines.length - 1;
    const currentLineText = lines[currentLineNumber];

    // Calculate the position of the cursor
    const lineHeight = 20; // Approximate line height in pixels
    const charWidth = 8.5; // Approximate character width in pixels

    const top = currentLineNumber * lineHeight + textarea.getBoundingClientRect().top + window.scrollY;
    const left = currentLineText.length * charWidth + textarea.getBoundingClientRect().left;

    setSuggestionPosition({ top, left });
  };

  const handleExpressionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newExpression = e.target.value;
    const cursorPos = e.target.selectionStart;
    setExpression(newExpression);
    setCursorPosition(cursorPos);
    parseExpression(newExpression);

    const beforeCursor = newExpression.slice(0, cursorPos);
    const match = beforeCursor.match(/[a-zA-Z]+$/);

    if (match && !isWithinString(newExpression, cursorPos)) {
      const searchTerm = match[0].toLowerCase();
      const matchedMethods = spelMethods.filter(method =>
          method.name.toLowerCase().startsWith(searchTerm)
      );
      setSuggestions(matchedMethods);
      setShowSuggestions(matchedMethods.length > 0);
      updateSuggestionPosition();
    } else {
      setShowSuggestions(false);
    }
  };

  const isWithinString = (text: string, position: number): boolean => {
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < position; i++) {
      const char = text[i];
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      }
    }

    return inSingleQuote || inDoubleQuote;
  };

  const insertSuggestion = (methodName: string) => {
    const beforeCursor = expression.slice(0, cursorPosition);
    const afterCursor = expression.slice(cursorPosition);
    const match = beforeCursor.match(/[a-zA-Z]+$/);

    if (match) {
      const newExpression = beforeCursor.slice(0, -match[0].length) + methodName + '()' + afterCursor;
      setExpression(newExpression);
      setShowSuggestions(false);

      const newCursorPos = beforeCursor.length - match[0].length + methodName.length + 1;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleInputTypeChange = (key: string, type: InputType) => {
    setInputTypes(prev => ({ ...prev, [key]: type }));
    if (type === 'null') {
      setKeyValues(prev => ({ ...prev, [key]: 'null' }));
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setKeyValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (validationError) {
      setResult({
        result: '',
        error: validationError.message
      });
      return;
    }

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
        error: 'Failed to connect to the server' + error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center">
                <Code2 className="w-10 h-10 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Spring Expression Evaluator</h1>
              <p className="text-gray-600 max-w-xl mx-auto">
                Enter a SpEL expression and provide values for evaluation. The evaluator will automatically detect required keys from your expression.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-8">
                <div className="editor-container">
                  <div className="editor-wrapper">
                    <div className="editor-header">
                      <div className="window-controls">
                        <div className="window-control close"></div>
                        <div className="window-control minimize"></div>
                        <div className="window-control maximize"></div>
                      </div>
                      <span className="editor-title">SpEL Expression Editor</span>
                    </div>
                    <div className="editor-content">
                      <div className="line-numbers">
                        {Array.from({ length: lineCount }, (_, i) => (
                            <div key={i + 1}>{i + 1}</div>
                        ))}
                      </div>
                      <div className="editor-main">
                        <div
                            className="editor-highlight"
                            dangerouslySetInnerHTML={{ __html: getHighlightedExpression() }}
                        />
                        <textarea
                            ref={textareaRef}
                            value={expression}
                            onChange={handleExpressionChange}
                            className="editor-textarea"
                            placeholder="Example: get('city').equals('London') ? get('city').toUpperCase() : 'Not London'"
                            spellCheck="false"
                        />
                      </div>
                    </div>
                  </div>

                  {validationError && (
                      <div className="mt-4 p-4 rounded-lg border bg-red-50 border-red-200">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                            <p className="mt-1 text-sm text-red-700">{validationError.message}</p>
                          </div>
                        </div>
                      </div>
                  )}

                  {showSuggestions && (
                      <div
                          className="fixed z-10 w-80 bg-[#3c3f41] border border-[#323232] rounded-lg shadow-lg max-h-64 overflow-y-auto"
                          style={{
                            top: `${suggestionPosition.top}px`,
                            left: `${suggestionPosition.left}px`,
                          }}
                      >
                        {suggestions.map((method) => (
                            <div
                                key={method.name}
                                className="p-2 hover:bg-[#4c5052] cursor-pointer flex items-center justify-between text-[#a9b7c6]"
                                onClick={() => insertSuggestion(method.name)}
                            >
                              <div>
                                <span className="font-mono text-[#ffc66d]">{method.name}</span>
                                {method.parameters && (
                                    <span className="text-[#808080] text-sm ml-2">({method.parameters.join(', ')})</span>
                                )}
                              </div>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-4 h-4 text-[#808080]" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs bg-[#3c3f41] text-[#a9b7c6] border-[#323232]">
                                  <div className="space-y-1">
                                    <p className="font-medium">{method.description}</p>
                                    <p className="text-xs text-[#808080]">Returns: {method.returns}</p>
                                    {method.parameters && (
                                        <p className="text-xs text-[#808080]">
                                          Parameters: {method.parameters.join(', ')}
                                        </p>
                                    )}
                                    <p className="text-xs font-mono bg-[#2b2b2b] p-1 rounded">
                                      Example: {method.example}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                        ))}
                      </div>
                  )}

                  <button
                      onClick={handleSubmit}
                      disabled={loading || keys.length === 0 || !expression.trim() || validationError !== null}
                      className="mt-4 w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
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
                                <div className="mt-1 text-sm text-green-700 font-mono bg-green-100 p-3 rounded overflow-x-auto">
                                  {result.result}
                                </div>
                              </div>
                            </div>
                        )}
                      </div>
                  )}
                </div>
              </div>

              <div className="col-span-12 xl:col-span-4 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                {keys.length > 0 ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-start gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Variable className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">Variable Values</h2>
                          <p className="text-sm text-gray-500 mt-1">
                            Set values for the variables in your expression
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 overflow-y-auto max-h-[calc(100vh-24rem)]">
                        {keys.map(key => (
                            <div key={key} className="bg-gray-50 p-4 rounded-lg">
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
                                        onChange={(e) => handleValueChange(key, e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder={`Enter value for ${key}`}
                                    />
                                ) : (
                                    <div className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-500">
                                      null
                                    </div>
                                )}
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
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                get('city').equals('London') ? get('city').toUpperCase() : 'Not London'
              </code>
            </div>
          </div>
        </div>
      </TooltipProvider>
  );
}

export default App;