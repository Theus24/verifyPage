# 🔐 LDA Verify — Verificação Externa para Discord

Sistema de verificação externa utilizando OAuth2 do Discord para autenticar usuários e conceder automaticamente o cargo **Verificado** dentro do servidor.

## 📋 Requisitos

* Node.js 16 ou superior
* Bot adicionado ao servidor
* Aplicação configurada no Discord Developer Portal

---

## 🚀 Instalação

Clone o repositório:

```bash
git clone https://github.com/Theus24/qualquer.git
cd qualquer
```

Instale as dependências:

```bash
npm install
```

---

## ⚙️ Configuração

Copie o arquivo `.env.example` para `.env` e preencha as informações:

```env
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
VERIFIED_ROLE_ID=
BASE_URL=
PORT=3000
```

### Variáveis

| Variável              | Descrição                                   |
| --------------------- | ------------------------------------------- |
| DISCORD_CLIENT_ID     | ID da aplicação OAuth2                      |
| DISCORD_CLIENT_SECRET | Chave secreta da aplicação                  |
| DISCORD_BOT_TOKEN     | Token do bot                                |
| DISCORD_GUILD_ID      | ID do servidor                              |
| VERIFIED_ROLE_ID      | Cargo que será concedido após a verificação |
| BASE_URL              | URL pública do sistema                      |
| PORT                  | Porta da aplicação                          |

---

## ▶️ Inicialização

```bash
npm start
```

Após iniciar, o sistema ficará disponível na URL definida em `BASE_URL`.

---

## 🔍 Como funciona

1. O usuário clica no botão **Verificar-se**.
2. É redirecionado para o login oficial do Discord.
3. Autoriza a aplicação utilizando OAuth2.
4. O sistema obtém as informações da conta.
5. O usuário é adicionado ao servidor (caso ainda não esteja).
6. O cargo **Verificado** é atribuído automaticamente.

Fluxo resumido:

```text
Usuário
   ↓
Login Discord OAuth2
   ↓
Autorização
   ↓
Validação
   ↓
Entrada no servidor
   ↓
Cargo Verificado
```

---

## 💻 Exemplo de botão de verificação

```js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const embed = new EmbedBuilder()
  .setTitle('Verificação Externa')
  .setDescription(
    'Clique no botão abaixo para verificar sua conta.'
  );

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Verificar-se')
    .setStyle(ButtonStyle.Link)
    .setURL(`${process.env.BASE_URL}/login`)
);

channel.send({
  embeds: [embed],
  components: [row]
});
```

---

## ⚠️ Observações

* O bot precisa da permissão **Gerenciar Cargos**.
* O cargo do bot deve estar acima do cargo de verificação.
* Caso utilize intents privilegiadas, elas devem ser ativadas no Discord Developer Portal.
* A URL definida em `BASE_URL` deve ser exatamente a mesma cadastrada nos Redirect URIs da aplicação.

---

## 🛡️ Segurança

O sistema utiliza exclusivamente o OAuth2 oficial do Discord para autenticação dos usuários.

Nenhuma senha é armazenada ou processada pelo projeto.

---

## 📜 Licença

Projeto desenvolvido para fins educacionais e administrativos de servidores Discord.
