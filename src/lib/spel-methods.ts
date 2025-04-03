// SpEL method definitions with descriptions and examples
export interface SpelMethod {
  name: string;
  description: string;
  example: string;
  returns: string;
  parameters?: string[];
}

export const spelMethods: SpelMethod[] = [
  {
    name: 'get',
    description: 'Retrieves a value from the context by key',
    example: "get('city')",
    returns: 'any',
    parameters: ['key']
  },
  {
    name: 'equals',
    description: 'Compares two values for equality',
    example: "get('city').equals('London')",
    returns: 'boolean',
    parameters: ['value']
  },
  ,
  {
    name: 'equalsIgnoreCase',
    description: 'Compares two values for equality - Ignores Case',
    example: "get('city').equalsIgnoreCase('London')",
    returns: 'boolean',
    parameters: ['value']
  },
  {
    name: 'toUpperCase',
    description: 'Converts string to uppercase',
    example: "get('city').toUpperCase()",
    returns: 'string'
  },
  {
    name: 'toLowerCase',
    description: 'Converts string to lowercase',
    example: "get('city').toLowerCase()",
    returns: 'string'
  },
  {
    name: 'concat',
    description: 'Concatenates strings',
    example: "get('str1').concat(get('str2'))",
    returns: 'string',
    parameters: ['str']
  },
  {
    name: 'contains',
    description: 'Checks if string contains substring',
    example: "get('text').contains('search')",
    returns: 'boolean',
    parameters: ['substring']
  },
  {
    name: 'length',
    description: 'Returns the length of string',
    example: "get('text').length()",
    returns: 'number'
  },
  {
    name: 'substring',
    description: 'Extracts part of string from startIndex (inclusive) to endIndex (exclusive)',
    example: "get('text').substring(0, 3)",
    returns: 'string',
    parameters: ['startIndex', 'endIndex']
  },
  {
    name: 'trim',
    description: 'Removes leading and trailing whitespace',
    example: "get('text').trim()",
    returns: 'string'
  },
  {
    name: 'replace',
    description: 'Replaces all occurrences of target with replacement',
    example: "get('text').replace('old', 'new')",
    returns: 'string',
    parameters: ['target', 'replacement']
  },
  {
    name: 'replaceAll',
    description: 'Replaces all occurrences matching regex pattern with replacement',
    example: "get('text').replaceAll('\\s+', ' ')",
    returns: 'string',
    parameters: ['regex', 'replacement']
  },
  {
    name: 'replaceFirst',
    description: 'Replaces first occurrence matching regex pattern with replacement',
    example: "get('text').replaceFirst('\\d+', '#')",
    returns: 'string',
    parameters: ['regex', 'replacement']
  },
  {
    name: 'startsWith',
    description: 'Checks if string starts with prefix, optionally from given position',
    example: "get('text').startsWith('prefix', 0)",
    returns: 'boolean',
    parameters: ['prefix', 'position?']
  },
  {
    name: 'endsWith',
    description: 'Checks if string ends with suffix',
    example: "get('text').endsWith('suffix')",
    returns: 'boolean',
    parameters: ['suffix']
  },
  {
    name: 'indexOf',
    description: 'Returns index of first occurrence of substring, or -1 if not found. Optionally starts search from position',
    example: "get('text').indexOf('search', 0)",
    returns: 'number',
    parameters: ['str', 'position?']
  },
  {
    name: 'lastIndexOf',
    description: 'Returns index of last occurrence of substring, or -1 if not found. Optionally starts search from position',
    example: "get('text').lastIndexOf('search', text.length())",
    returns: 'number',
    parameters: ['str', 'position?']
  },
  {
    name: 'matches',
    description: 'Checks if string matches regex pattern',
    example: "get('text').matches('[A-Za-z]+')",
    returns: 'boolean',
    parameters: ['regex']
  },
  {
    name: 'split',
    description: 'Splits string by regex delimiter, optionally limiting number of splits',
    example: "get('text').split(',', 2)",
    returns: 'string[]',
    parameters: ['regex', 'limit?']
  },
  {
    name: 'isEmpty',
    description: 'Checks if string is empty (length = 0)',
    example: "get('text').isEmpty()",
    returns: 'boolean'
  },
  {
    name: 'isBlank',
    description: 'Checks if string is empty or contains only whitespace',
    example: "get('text').isBlank()",
    returns: 'boolean'
  },
  {
    name: 'strip',
    description: 'Removes leading and trailing whitespace (Unicode-aware)',
    example: "get('text').strip()",
    returns: 'string'
  },
  {
    name: 'stripLeading',
    description: 'Removes leading whitespace (Unicode-aware)',
    example: "get('text').stripLeading()",
    returns: 'string'
  },
  {
    name: 'stripTrailing',
    description: 'Removes trailing whitespace (Unicode-aware)',
    example: "get('text').stripTrailing()",
    returns: 'string'
  },
  {
    name: 'repeat',
    description: 'Repeats string count times',
    example: "get('text').repeat(3)",
    returns: 'string',
    parameters: ['count']
  },
  {
    name: 'subSequence',
    description: 'Returns CharSequence from start (inclusive) to end (exclusive)',
    example: "get('text').subSequence(0, 3)",
    returns: 'string',
    parameters: ['start', 'end']
  },
  {
    name: 'compareToIgnoreCase',
    description: 'Compares strings lexicographically, ignoring case',
    example: "get('text').compareToIgnoreCase('other')",
    returns: 'number',
    parameters: ['other']
  },
  {
    name: 'compareTo',
    description: 'Compares strings lexicographically',
    example: "get('text').compareTo('other')",
    returns: 'number',
    parameters: ['other']
  },
  {
    name: 'contentEquals',
    description: 'Checks if string contains same character sequence',
    example: "get('text').contentEquals('other')",
    returns: 'boolean',
    parameters: ['other']
  },
  {
    name: 'formatted',
    description: 'Returns formatted string using arguments',
    example: "get('Hello %s').formatted('World')",
    returns: 'string',
    parameters: ['...args']
  },
  
  {
    name: 'indent',
    description: 'Adjusts indentation of each line',
    example: "get('text').indent(2)",
    returns: 'string',
    parameters: ['level']
  },
  {
    name: 'transform',
    description: 'Applies function to string',
    example: "get('text').transform(str => str.toUpperCase())",
    returns: 'any',
    parameters: ['function']
  },
  {
    name: 'translateEscapes',
    description: 'Translates escape sequences',
    example: "get('text\\n').translateEscapes()",
    returns: 'string'
  }
];