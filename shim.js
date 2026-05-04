// shim.js
if (typeof global.__dirname === 'undefined') {
    global.__dirname = '/';
  }
  if (typeof global.__filename === 'undefined') {
    global.__filename = '';
  }
  
  if (typeof window === 'undefined') {
    global.window = global;
  }
  
  if (typeof document === 'undefined') {
    global.document = {
      createElement: () => ({}),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }