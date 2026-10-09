# API de exercícios — Node.js + Express

## Executar

1. Abra esta pasta no VS Code.
2. No terminal, execute `npm install`.
3. Execute `npm start`.
4. API: `http://localhost:3000`.

Use o Postman ou Thunder Client para as rotas POST, PUT e DELETE, enviando JSON em `Body > raw > JSON`.

## Exemplos de requisições

### Triângulo (GET)
- `http://localhost:3000/triangulo?lado1=3&lado2=3&lado3=3` → equilátero
- `http://localhost:3000/triangulo?lado1=5&lado2=5&lado3=8` → isósceles
- `http://localhost:3000/triangulo?lado1=3&lado2=4&lado3=5` → escaleno
- `http://localhost:3000/triangulo?lado1=1&lado2=2&lado3=3` → inválido

### Boletim (POST /boletim)
```json
{"nome":"Mariana","nota1":8,"nota2":6,"frequencia":80}
```

### Frete (GET)
`http://localhost:3000/frete?valor=180&peso=3&regiao=sudeste`

### Parcelamento (POST /parcelamento)
```json
{"valor":300,"parcelas":8}
```

### Números (POST /numeros)
```json
{"numeros":[1,2,3,4,5]}
```

### Alunos
- `GET /alunos` — lista todos
- `GET /alunos?aprovado=true` — lista aprovados
- `GET /alunos/1` — busca por ID
- `GET /alunos/ranking/medias` — ordena por média decrescente
- `POST /alunos` — cria aluno, exemplo:
```json
{"id":4,"nome":"Daniel","nota1":9,"nota2":8}
```
- `PUT /alunos/4` — substitui dados do aluno, exemplo:
```json
{"nome":"Daniel Silva","nota1":8,"nota2":9}
```
- `DELETE /alunos/4` — exclui aluno

**Observação:** os alunos ficam em um array na memória, ou seja, os dados são reiniciados quando o servidor é encerrado.
