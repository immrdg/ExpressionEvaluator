import React, { useState, useRef, useEffect } from 'react';
import { Files, Settings, Terminal, FileCode, Variable, Plus, Play, AlertCircle } from 'lucide-react';

interface FileData {
  name: string;
  content: string;
  variables: Record<string, string>;
}

interface EvaluationResult {
  result: string;
  error?: string;
}

const initialFiles: FileData[] = [
  {
    name: 'example.ee',
    content: 'get("name").equals("John") ? get("greeting").concat(" ").concat(get("name")) : "Hello, stranger!"',
    variables: {
      name: "John",
      greeting: "Hello"
    }
  }
];

function App() {
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [activeFile, setActiveFile] = useState<FileData>(files[0]);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const parseExpression = (expr: string): string[] => {
    const getCallRegex = /get\(['"]([\w\d]+)['"]\)/g;
    const matches = Array.from(expr.matchAll(getCallRegex));
    return [...new Set(matches.map(match => match[1]))];
  };

  useEffect(() => {
    const variables = parseExpression(activeFile.content);
    const updatedVariables = { ...activeFile.variables };
    
    // Add new variables with empty values
    variables.forEach(variable => {
      if (!(variable in updatedVariables)) {
        updatedVariables[variable] = '';
      }
    });

    // Remove variables that are no longer in the expression
    Object.keys(updatedVariables).forEach(key => {
      if (!variables.includes(key)) {
        delete updatedVariables[key];
      }
    });

    setFiles(files.map(file => 
      file.name === activeFile.name 
        ? { ...file, variables: updatedVariables }
        : file
    ));
    setActiveFile(prev => ({ ...prev, variables: updatedVariables }));
  }, [activeFile.content]);

  const createNewFile = () => {
    setIsCreatingFile(true);
    setTimeout(() => {
      newFileInputRef.current?.focus();
    }, 0);
  };

  const handleNewFileSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const fileName = newFileName.trim();
      if (fileName && !files.some(f => f.name === fileName)) {
        const newFile: FileData = {
          name: fileName.endsWith('.ee') ? fileName : `${fileName}.ee`,
          content: '',
          variables: {}
        };
        const updatedFiles = [...files, newFile];
        setFiles(updatedFiles);
        setActiveFile(newFile);
      }
      setIsCreatingFile(false);
      setNewFileName('');
    } else if (e.key === 'Escape') {
      setIsCreatingFile(false);
      setNewFileName('');
    }
  };

  const updateVariable = (name: string, value: string) => {
    const updatedFiles = files.map(file => {
      if (file.name === activeFile.name) {
        return {
          ...file,
          variables: {
            ...file.variables,
            [name]: value
          }
        };
      }
      return file;
    });
    
    setFiles(updatedFiles);
    setActiveFile(updatedFiles.find(f => f.name === activeFile.name)!);
  };

  const updateFileContent = (content: string) => {
    const updatedFiles = files.map(file => {
      if (file.name === activeFile.name) {
        return {
          ...file,
          content
        };
      }
      return file;
    });
    setFiles(updatedFiles);
    setActiveFile(updatedFiles.find(f => f.name === activeFile.name)!);
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expression: activeFile.content,
          variables: activeFile.variables
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        result: '',
        error: 'Failed to connect to the server: ' + error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vscode-window">
      <div className="activity-bar">
        <div className="flex flex-col gap-4">
          <button className="p-2 hover:bg-gray-700 rounded">
            <Files className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <Terminal className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="sidebar">
        <div className="file-explorer">
          <div className="flex items-center justify-between text-sm text-gray-400 uppercase mb-2 px-2">
            <span>Explorer</span>
            <button 
              onClick={createNewFile}
              className="hover:bg-gray-700 rounded p-1"
              title="New File"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {isCreatingFile && (
            <div className="px-2 mb-2">
              <input
                ref={newFileInputRef}
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={handleNewFileSubmit}
                placeholder="filename.ee"
                className="w-full bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-sm text-gray-300"
              />
            </div>
          )}

          {files.map((file) => (
            <div
              key={file.name}
              className={`file-item ${activeFile.name === file.name ? 'active' : ''}`}
              onClick={() => setActiveFile(file)}
            >
              <FileCode className="w-4 h-4 text-blue-400" />
              {file.name}
            </div>
          ))}
        </div>
      </div>

      <div className="editor-group">
        <div className="tab-bar">
          {files.map((file) => (
            <div
              key={file.name}
              className={`tab ${activeFile.name === file.name ? 'active' : ''}`}
              onClick={() => setActiveFile(file)}
            >
              <FileCode className="w-4 h-4 text-blue-400" />
              {file.name}
            </div>
          ))}
        </div>

        <div className="p-4 border-b border-[#3e3e42]">
          <button
            onClick={handleEvaluate}
            disabled={loading || !activeFile.content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Evaluating...' : 'Evaluate Expression'}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${
              result.error ? 'bg-red-950 border-red-900' : 'bg-green-950 border-green-900'
            }`}>
              {result.error ? (
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Evaluation Error</h3>
                    <p className="text-sm mt-1">{result.error}</p>
                  </div>
                </div>
              ) : (
                <div className="text-green-400">
                  <h3 className="font-medium">Result</h3>
                  <p className="font-mono bg-green-900/50 p-2 rounded mt-2">{result.result}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="editor-content grid grid-cols-2 gap-4">
          <div className="monaco-editor text-sm">
            <textarea
              value={activeFile.content}
              onChange={(e) => updateFileContent(e.target.value)}
              className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-gray-300"
              spellCheck="false"
              placeholder="Enter your expression here..."
            />
          </div>
          <div className="variables-panel bg-[#1e1e1e] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Variable className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-semibold text-gray-300">Variables</h2>
            </div>
            
            <div className="space-y-4">
              {Object.entries(activeFile.variables).map(([name, value]) => (
                <div key={name} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    readOnly
                    className="flex-1 bg-[#2d2d2d] border border-[#3e3e42] rounded px-2 py-1 text-sm text-gray-300"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateVariable(name, e.target.value)}
                    className="flex-1 bg-[#2d2d2d] border border-[#3e3e42] rounded px-2 py-1 text-sm text-gray-300"
                    placeholder="Enter value..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;