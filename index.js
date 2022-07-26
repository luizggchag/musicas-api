const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { pool } = require('./config')

var http = require('http');
const httpProxy = require('express-http-proxy')
const helmet = require('helmet');

require("dotenv-safe").config();
const jwt = require('jsonwebtoken');

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())
app.use(helmet());

/**
 * 
 */

function verificaJWT(request, response, next) {
    const token = request.headers['x-access-token'];
    if (!token) {
        return response.status(401).json({ auth: false, message: 'Sem token!' });
    }

    jwt.verify(token, process.env.SECRET, function (err, decoded) {
        if (err) {
            console.log(err);
            return response.status(500).json({ auth: false, message: 'Erro ao autenticar o token.' });
        }

        console.log(decoded);
        request.userName = decoded.nome;
        next();
    });
}

const login = (request, response, next) => {
    const { nome, senha } = request.body;

    pool.query('SELECT * FROM usuarios where nome=$1 and senha=$2',
        [nome, senha], (error, results) => {

            if (error || results.rowCount == 0) {
                return response.status(400).json({ auth: false, message: 'Login inválido' });
            } else {
                const userName = results.rows[0].nome;

                const token = jwt.sign({ userName }, process.env.SECRET, {
                    expiresIn: 600 // expira em 10 min
                })

                return response.json({ auth: true, token: token })
            }
        },
    );
}

app.route("/login").post(login)

/**
 * 
 */

const getArtistas = (request, response) => {
    pool.query('SELECT * FROM artistas', (error, results) => {
        if (error) {
            return response.status(401).json({
                status: 'error',
                message: 'Erro: ' + error
            });
        }
        response.status(200).json(results.rows)
    })
}

const addArtista = (request, response) => {
    const { nome } = request.body

    pool.query(
        'INSERT INTO artistas (nome) VALUES ($1)',
        [nome],
        (error) => {
            if (error) {
                return response.status(401).json({
                    status: 'error',
                    message: 'Erro: ' + error
                });
            }
            response.status(201).json({ status: 'success', message: 'Artista criada.' })
        },
    )
}

const updateArtista = (request, response) => {
    const { codigo, nome } = request.body
    pool.query('UPDATE artistas set nome=$1 where codigo=$2',
        [nome, codigo], error => {
            if (error) {
                return response.status(401).json({
                    status: 'error',
                    message: 'Erro: ' + error
                });
            }
            response.status(201).json({ status: 'success', message: 'Artista atualizada.' })
        })
}

const deleteArtista = (request, response) => {
    const codigo = parseInt(request.params.id);
    pool.query('DELETE FROM artistas where codigo = $1', [codigo], error => {
        if (error) {
            return response.status(401).json({
                status: 'error',
                message: 'Erro: ' + error
            });
        }
        response.status(201).json({ status: 'success', message: 'Artista apagada.' })
    })
}

const getArtistaPorID = (request, response) => {
    const codigo = parseInt(request.params.id);
    pool.query('SELECT * FROM artistas where codigo = $1', [codigo], (error, results) => {
        if (error) {
            return response.status(401).json({
                status: 'error',
                message: 'Erro: ' + error
            });
        }
        response.status(200).json(results.rows)
    })
}

app
    .route('/artistas')
    // GET endpoint
    .get(verificaJWT, getArtistas)
    // POST endpoint
    .post(verificaJWT, addArtista)
    // PUT
    .put(verificaJWT, updateArtista)

app.route('/artistas/:id')
    .get(verificaJWT, getArtistaPorID)
    .delete(verificaJWT, deleteArtista)

/** 
 * 
*/

const getMusicas = (request, response) => {
    pool.query(`
        select mus.codigo, mus.nome, mus.duracao, art.nome as nomeArtista, art.codigo as codArtista
        from musicas mus INNER JOIN artistas art ON art.codigo = mus.codigo_artista
    `, (error, results) => {
        if (error) {
            return response.status(401).json({
                status: 'error',
                message: 'Erro: ' + error
            });
        }
        response.status(200).json(results.rows)
    })
}

const addMusica = (request, response) => {
    const { codArtista, nome, duracao } = request.body

    pool.query(
        'INSERT INTO musicas (codigo_artista, nome, duracao) VALUES ($1, $2, $3)',
        [codArtista, nome, duracao],
        (error) => {
            if (error) {
                return response.status(401).json({
                    status: 'error',
                    message: 'Erro: ' + error
                });
            }
            response.status(201).json({ status: 'success', message: 'Musica criada.' })
        },
    )
}

const updateMusica = (request, response) => {
    const { codArtista, nome, duracao, codigo } = request.body
    pool.query('UPDATE musicas set codigo_artista=$1, nome=$2, duracao=$3 where codigo=$4',
        [codArtista, nome, duracao, codigo], error => {
            if (error) {
                return response.status(401).json({
                    status: 'error',
                    message: 'Erro: ' + error
                });
            }
            response.status(201).json({ status: 'success', message: 'Musica atualizada.' })
        })
}

const deleteMusica = (request, response) => {
    const codigo = parseInt(request.params.id);
    pool.query('DELETE FROM musicas where codigo = $1', [codigo], error => {
        if (error) {
            return response.status(401).json({
                status: 'error',
                message: 'Erro: ' + error
            });
        }
        response.status(201).json({ status: 'success', message: 'Musica apagada.' })
    })
}

const getMusicaPorID = (request, response) => {
    const codigo = parseInt(request.params.id);
    pool.query(
        `
        select mus.codigo, mus.nome, mus.duracao, art.nome as nomeArtista, art.codigo as codArtista
        from musicas mus INNER JOIN artistas art ON art.codigo = mus.codigo_artista
        where mus.codigo = $1
    `, [codigo], (error, results) => {
        if (error) {
            return response.status(401).json({
                status: 'error',
                message: 'Erro: ' + error
            });
        }
        response.status(200).json(results.rows)
    })
}

app
    .route('/musicas')
    // GET endpoint
    .get(verificaJWT, getMusicas)
    // POST endpoint
    .post(verificaJWT, addMusica)
    // PUT
    .put(verificaJWT, updateMusica)

app.route('/musicas/:id')
    .get(verificaJWT, getMusicaPorID)
    .delete(verificaJWT, deleteMusica)

/**
 * 
 */

const ola = (request, response, next) => {
    response.status(200).json("TESTE");
}

app.route("/ola").get(verificaJWT, ola)


/**
 * 
 */

var server = http.createServer(app);
server.listen(process.env.PORT || 3000);