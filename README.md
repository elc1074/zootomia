# Zootomia

## Sobre o Projeto
O Zootomia é um sistema de apoio ao estudo de anatomia de animais de companhia, pensado para auxiliar estudantes de Medicina Veterinária na preparação para aulas práticas e avaliações. O projeto faz parte da disciplina de Projeto de Software II da Universidade Federal de Santa Maria e atualmente encontra-se em sua fase inicial de desenvolvimento.

## O Problema
O ensino de anatomia frequentemente esbarra na questão do acesso restrito aos laboratórios físicos. Isso faz com que os alunos precisem revisar o conteúdo utilizando apenas livros e imagens bidimensionais, o que é distante da realidade exigida nas provas práticas. A ideia do sistema é oferecer um recurso extra e mais próximo da realidade que os estudantes possam acessar diretamente de seus computadores.

## Escopo Atual: Osteologia
Como estamos nos primeiros passos da construção do software, decidimos focar o desenvolvimento inicial exclusivamente na **osteologia** de cães e gatos. Isso nos permitirá estruturar a base da aplicação antes de pensar em expandir para outros sistemas anatômicos.

## Funcionalidades Previstas
Nesta fase inicial, estamos planejando implementar as seguintes funcionalidades:
*   **Visualização anatômica interativa:** O objetivo é permitir que o usuário explore as estruturas ósseas por diferentes ângulos.
*   **Testes de conhecimento (Quiz):** Planejamos incluir um espaço onde o aluno seja desafiado a identificar as estruturas anatômicas para testar seus conhecimentos e acompanhar seu progresso.

## Público e Validação
*   **Usuários Finais:** O sistema tem como foco os estudantes matriculados na disciplina ZOO-00171 – Anatomía de Animales de Compañía, ministrada no Chile.
*   **Especialistas de Domínio:** Para validar o desenvolvimento, contamos com o apoio de estudantes chilenos da Universidad Santo Tomás (UST), que nos ajudam a entender as necessidades reais da disciplina e a direcionar o projeto.

## Possíveis Materiais de Referência
Ainda estamos definindo os materiais que servirão de base definitiva para a extração do conteúdo e imagens. Algumas das referências que encontramos e estamos avaliando utilizar são:
*   Atlas de Osteología de los Mamíferos Domésticos
*   Atlas del Sistema Nervioso Periférico en el Perro (material mapeado para possíveis etapas futuras).

## Tecnologias e Design
*   **Desenvolvimento:** A aplicação está sendo construída com o framework Next.js.
*   **Interface:** Fizemos uma visualização inicial para guiar a interface do projeto no Figma. O protótipo pode ser acessado através deste [link de design](https://www.figma.com/make/6LhqJor9kFEnbuyjUK8ID2/Zootomia-App-UI-Design?p=f).

## Equipe
O projeto é desenvolvido pelos seguintes estudantes da Universidade Federal de Santa Maria[cite: 1]:
*   Isadora Spohr
*   Gustavo Pott
*   Luiza Manoelle dos Santos
*   Leonardo Dallanora

## Instalação
Os instaladores estão disponíveis [aqui](https://drive.google.com/drive/folders/117dGw0v9_B08ZhomHwqrxwKIz5SP8B4O?usp=sharing).
## Desenvolvimento

### Instalar as dependências

Após clonar o projeto:

```bash
npm install
```

### Executar a aplicação web

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:3000
```

### Executar a aplicação Electron

Primeiro, gere a versão estática do Next.js:

```bash
npm run build
```

Depois execute o Electron:

```bash
npm run electron
```

No Linux, caso ocorram problemas relacionados ao Wayland/Vulkan, execute:

```bash
npx electron --disable-gpu --ozone-platform=x11 electron/main.js
```

---
# Build para Linux

Para gerar a versão Linux da aplicação, execute:

```bash
npm run build
npx electron-builder --linux
```

Os arquivos gerados serão disponibilizados na pasta:

```text
dist/
```

Para gerar especificamente um AppImage:

```bash
npm run build
npx electron-builder --linux AppImage
```

## Execução no Linux

Em alguns ambientes Linux, especialmente utilizando Wayland/Vulkan, o Electron pode apresentar problemas relacionados à GPU ou ao backend gráfico.

Para executar a aplicação Electron com uma configuração compatível nesses casos, utilize:

```bash
npx electron --disable-gpu --ozone-platform=x11 electron/main.js
```

Após gerar a aplicação empacotada, a versão não instalada pode ser executada com:

```bash
./dist/linux-unpacked/zootomia --disable-gpu --ozone-platform=x11
```

Os parâmetros:

```text
--disable-gpu
```

desabilita a aceleração gráfica por GPU.

```text
--ozone-platform=x11
```

faz o Electron utilizar o backend X11 em vez do Wayland.

Esses parâmetros são necessários caso o ambiente Linux apresente problemas de compatibilidade com Wayland/Vulkan.

---

# Build para macOS

O build para macOS é realizado automaticamente pelo GitHub Actions, utilizando um runner macOS. Dessa forma, não é necessário possuir um computador com macOS.

O workflow responsável pelo build está localizado em:

```text
.github/workflows/build-mac.yml
```

## Executar o build

No GitHub:

1. Acesse o repositório.
2. Abra a aba **Actions**.
3. Selecione o workflow **Build macOS**.
4. Clique em **Run workflow**.
5. Confirme em **Run workflow**.

O GitHub irá criar uma máquina macOS temporária e executar o processo de build.

O processo realizado pelo workflow é:

```text
Checkout do projeto
        ↓
Instalação das dependências
        ↓
Build do Next.js
        ↓
Build do Electron para macOS
        ↓
Geração do .dmg e .zip
        ↓
Upload dos arquivos como artefatos
```

Após a execução do workflow:

1. Abra a execução concluída.
2. Localize a seção **Artifacts**.
3. Baixe o artefato `zootomia-macos`.

Dentro dele estarão os arquivos gerados para macOS, incluindo:

```text
.dmg
.zip
```

## Workflow do macOS

O arquivo `.github/workflows/build-mac.yml` contém:

```yaml
name: Build macOS

on:
  workflow_dispatch:

jobs:
  build-mac:
    runs-on: macos-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Instalar dependências
        run: npm ci

      - name: Build Next.js
        run: npm run build

      - name: Build macOS
        run: npx electron-builder --mac --publish never

      - name: Upload DMG
        uses: actions/upload-artifact@v4
        with:
          name: zootomia-macos
          path: |
            dist/*.dmg
            dist/*.zip
```

> O build macOS gerado dessa forma não possui assinatura ou notarização da Apple. O macOS pode apresentar avisos ou bloquear a execução dependendo das configurações de segurança do sistema.


# Build para Windows

A versão Windows utiliza o Electron Builder com o instalador NSIS.

Para gerar o instalador, execute:

```bash
npm run build
npx electron-builder --win
```

O instalador será gerado na pasta:

```text
dist/
```

O arquivo esperado é semelhante a:

```text
dist/Zootomia Setup 0.1.0.exe
```

O número da versão pode mudar de acordo com a versão definida no `package.json`.

## Versão não instalada

O Electron Builder também gera uma versão não instalada da aplicação em:

```text
dist/win-unpacked/
```

Essa versão pode ser utilizada para testar a aplicação antes de instalar o programa.

## Testar o instalador

Após executar:

```bash
npx electron-builder --win
```

copie o arquivo `.exe` gerado em `dist/` para uma máquina Windows e execute-o.

Após a instalação, verifique:

- A aplicação abre normalmente.
- A página inicial é carregada.
- A navegação entre as páginas funciona.
- As imagens são carregadas.
- A página de jogo funciona.
- A galeria funciona.
- A página de anotação funciona.
- A aplicação fecha normalmente.

O Windows pode apresentar avisos de segurança ao executar um instalador que não possui assinatura digital. Isso não significa necessariamente que exista um problema com a aplicação.

## Gerar apenas o instalador Windows

Também é possível utilizar o script:

```bash
npm run dist:win
```

Caso esse script esteja configurado no `package.json` como:

```json
"dist:win": "npm run build && electron-builder --win"
```

Nesse caso, o comando executa automaticamente o build do Next.js antes de gerar o instalador.

---

# Resumo dos builds

## Linux

```bash
npm run build
npx electron-builder --linux
```

Para AppImage:

```bash
npm run build
npx electron-builder --linux AppImage
```

Para executar a versão empacotada em ambientes Linux com problemas de Wayland/Vulkan:

```bash
./dist/linux-unpacked/zootomia --disable-gpu --ozone-platform=x11
```

## Windows

```bash
npm run build
npx electron-builder --win
```

Instalador:

```text
dist/Zootomia Setup 0.1.0.exe
```

## macOS

O build é realizado pelo GitHub Actions:

```text
GitHub
→ Actions
→ Build macOS
→ Run workflow
→ Artifacts
→ zootomia-macos
```

O artefato contém:

```text
.dmg
.zip
```
