create table usuarios (
    nome varchar(50) primary key not null,
	senha varchar(50) not null
);

insert into usuarios (nome, senha) values ('pedro', 1234), ('bob', 1234);

----

create table artistas (
    codigo serial not null primary key, 
    nome varchar(50) not null
);

insert into artistas (nome) values ('Web Samba'),('React Rock');

----

create table musicas (
    codigo serial not null primary key, 
    codigo_artista int not null,
    nome varchar(50) not null,
    duracao float not null,
    foreign key(codigo_artista) references artistas(codigo)
);

insert into musicas (codigo_artista, nome, duracao) 
	values (1, 'Deixa passar de semestre naturalmente', 3.20),(2, 'We will not pegar reavaliacao', 3.55);

select mus.codigo, mus.nome, mus.duracao, art.nome as artista
from musicas mus INNER JOIN artistas art ON art.codigo = mus.codigo_artista