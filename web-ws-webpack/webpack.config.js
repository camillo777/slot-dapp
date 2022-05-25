export default [
/*{
  mode: 'development',
  devtool: 'inline-source-map',
  name: 'server code, output to ./server',
  entry: './index.js',
  output: {
    filename: './server/index.js'
  },
  target: 'node',
  externals: [{ 
    'express': { commonjs: 'express' },
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  }]
},*/
{
  mode: 'development',
  devtool: 'inline-source-map',
  name: 'client side, output to ./public',
  entry: './app.js',
  output: {
    filename: './public/app.js'
  }
}
];
