param(
  [int]$Port = 3001
)

$env:PORT = $Port
npm start
