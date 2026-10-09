const express = require('express');
const app = express();
app.use(express.json());

const erro = (res, mensagem, status = 400) => res.status(status).json({ erro: mensagem });
const numero = (valor) => {
  if (valor === undefined || valor === null || typeof valor === 'boolean' ||
      (typeof valor === 'string' && valor.trim() === '')) return NaN;
  return Number(valor);
};
const notaValida = (n) => Number.isFinite(n) && n >= 0 && n <= 10;
const dinheiro = (n) => Number(n.toFixed(2));
const media = (aluno) => (aluno.nota1 + aluno.nota2) / 2;

// 1 - Classificação de triângulos
app.get('/triangulo', (req, res) => {
  const lados = [numero(req.query.lado1), numero(req.query.lado2), numero(req.query.lado3)];
  if (lados.some(n => !Number.isFinite(n) || n <= 0)) {
    return res.status(400).json({ lados, valido: false, motivo: 'Os três lados devem ser números positivos.' });
  }
  const [a, b, c] = lados;
  if (!(a + b > c && a + c > b && b + c > a)) {
    return res.json({ lados, valido: false, classificacao: null, motivo: 'Não forma um triângulo: a soma de dois lados deve ser maior que o terceiro.' });
  }
  const classificacao = a === b && b === c ? 'equilátero' :
    a === b || a === c || b === c ? 'isósceles' : 'escaleno';
  res.json({ lados, valido: true, classificacao });
});

// 2 - Boletim
app.post('/boletim', (req, res) => {
  const { nome } = req.body || {};
  const nota1 = numero(req.body?.nota1);
  const nota2 = numero(req.body?.nota2);
  const frequencia = numero(req.body?.frequencia);
  if (typeof nome !== 'string' || !nome.trim()) return erro(res, 'O nome é obrigatório.');
  if (!notaValida(nota1) || !notaValida(nota2)) return erro(res, 'As notas devem estar entre 0 e 10.');
  if (!Number.isFinite(frequencia) || frequencia < 0 || frequencia > 100) return erro(res, 'A frequência deve estar entre 0 e 100.');
  const mediaFinal = (nota1 + nota2) / 2;
  const situacao = frequencia < 75 ? 'Reprovado por falta' : mediaFinal >= 7 ? 'Aprovado' : mediaFinal >= 5 ? 'Recuperação' : 'Reprovado por nota';
  res.json({ nome: nome.trim(), media: mediaFinal, frequencia, situacao });
});

// 3 - Frete
app.get('/frete', (req, res) => {
  const valor = numero(req.query.valor);
  const peso = numero(req.query.peso);
  const regiao = typeof req.query.regiao === 'string' ? req.query.regiao.trim().toLowerCase() : '';
  if (!Number.isFinite(valor) || valor <= 0 || !Number.isFinite(peso) || peso <= 0) return erro(res, 'Valor e peso devem ser números positivos.');
  if (!['sudeste', 'sul', 'outras'].includes(regiao)) return erro(res, 'Região deve ser sudeste, sul ou outras.');
  const freteBase = { sudeste: 12, sul: 18, outras: 25 }[regiao];
  const adicional = dinheiro(Math.max(0, peso - 2) * 4);
  const desconto = valor >= 250 ? dinheiro((freteBase + adicional) * 0.5) : 0;
  const frete = dinheiro(freteBase + adicional - desconto);
  res.json({ valorCompra: valor, peso, regiao, freteBase, adicional, desconto, frete, totalComFrete: dinheiro(valor + frete) });
});

// 4 - Parcelamento
app.post('/parcelamento', (req, res) => {
  const valor = numero(req.body?.valor);
  const parcelas = numero(req.body?.parcelas);
  if (!Number.isFinite(valor) || valor <= 0) return erro(res, 'O valor deve ser positivo.');
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12) return erro(res, 'Parcelas deve ser um inteiro entre 1 e 12.');
  const ajuste = dinheiro(parcelas === 1 ? -valor * 0.08 : parcelas >= 7 ? valor * 0.12 : 0);
  const total = dinheiro(valor + ajuste);
  res.json({ valorOriginal: valor, parcelas, desconto: ajuste < 0 ? -ajuste : 0, acrescimo: ajuste > 0 ? ajuste : 0, total, valorParcela: dinheiro(total / parcelas) });
});

// 5 - Análise de números
app.post('/numeros', (req, res) => {
  const numeros = req.body?.numeros;
  if (!Array.isArray(numeros) || numeros.length < 3 || numeros.length > 10) return erro(res, 'Envie um array numeros com 3 a 10 valores.');
  if (!numeros.every(Number.isInteger)) return erro(res, 'Todos os valores devem ser números inteiros.');
  const soma = numeros.reduce((acc, n) => acc + n, 0);
  const mediaNumeros = soma / numeros.length;
  res.json({ soma, media: mediaNumeros, maior: Math.max(...numeros), menor: Math.min(...numeros), pares: numeros.filter(n => n % 2 === 0).length, impares: numeros.filter(n => n % 2 !== 0).length, acimaDaMedia: numeros.filter(n => n > mediaNumeros).length });
});

// 6 - CRUD de alunos (memória: reinicia ao desligar a aplicação)
let alunos = [
  { id: 1, nome: 'Ana', nota1: 8, nota2: 9 },
  { id: 2, nome: 'Bruno', nota1: 5, nota2: 6 },
  { id: 3, nome: 'Carla', nota1: 7, nota2: 7 }
];
const comMedia = aluno => ({ ...aluno, media: media(aluno) });
const idDaRota = req => Number(req.params.id);
const validarAluno = (dados, exigeId) => {
  if (!dados || typeof dados.nome !== 'string' || !dados.nome.trim()) return 'Nome não pode estar vazio.';
  if (!notaValida(dados.nota1) || !notaValida(dados.nota2)) return 'Notas devem ser números entre 0 e 10.';
  if (exigeId && (!Number.isSafeInteger(dados.id) || dados.id <= 0)) return 'ID deve ser um inteiro positivo.';
  return null;
};
app.get('/alunos', (req, res) => {
  if (req.query.aprovado !== undefined && !['true', 'false'].includes(req.query.aprovado)) return erro(res, 'O filtro aprovado deve ser true ou false.');
  let lista = alunos;
  if (req.query.aprovado === 'true') lista = alunos.filter(a => media(a) >= 7);
  if (req.query.aprovado === 'false') lista = alunos.filter(a => media(a) < 7);
  res.json(lista.map(comMedia));
});
// Esta rota precisa vir antes de /alunos/:id
app.get('/alunos/ranking/medias', (req, res) => res.json([...alunos].sort((a, b) => media(b) - media(a)).map(comMedia)));
app.get('/alunos/:id', (req, res) => {
  const aluno = alunos.find(a => a.id === idDaRota(req));
  if (!aluno) return erro(res, 'Aluno não encontrado.', 404);
  res.json(comMedia(aluno));
});
app.post('/alunos', (req, res) => {
  const falha = validarAluno(req.body, true);
  if (falha) return erro(res, falha);
  if (alunos.some(a => a.id === req.body.id)) return erro(res, 'Já existe aluno com esse ID.', 409);
  const aluno = { id: req.body.id, nome: req.body.nome.trim(), nota1: req.body.nota1, nota2: req.body.nota2 };
  alunos.push(aluno);
  res.status(201).json(comMedia(aluno));
});
app.put('/alunos/:id', (req, res) => {
  const index = alunos.findIndex(a => a.id === idDaRota(req));
  if (index === -1) return erro(res, 'Aluno não encontrado.', 404);
  const falha = validarAluno(req.body, false);
  if (falha) return erro(res, falha);
  if (req.body.id !== undefined && req.body.id !== alunos[index].id) return erro(res, 'Não é permitido alterar o ID do aluno.');
  alunos[index] = { id: alunos[index].id, nome: req.body.nome.trim(), nota1: req.body.nota1, nota2: req.body.nota2 };
  res.json(comMedia(alunos[index]));
});
app.delete('/alunos/:id', (req, res) => {
  const index = alunos.findIndex(a => a.id === idDaRota(req));
  if (index === -1) return erro(res, 'Aluno não encontrado.', 404);
  const [removido] = alunos.splice(index, 1);
  res.json({ mensagem: 'Aluno excluído com sucesso.', aluno: comMedia(removido) });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) return erro(res, 'JSON inválido.');
  return erro(res, 'Erro interno do servidor.', 500);
});

if (require.main === module) app.listen(3000, () => console.log('API rodando em http://localhost:3000'));
module.exports = app;
