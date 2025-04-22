---
"pet-scheduler-api": patch
---

Correções e melhorias:
- Adiciona campo 'active' ao modelo User no esquema Prisma
- Refatora método 'save' no PrismaUserRepository para resolver erro na operação de login
- Adiciona configuração do Changesets para gerenciamento de versão e publicação
- Adiciona scripts 'format-check', 'version' e 'release' ao package.json
- Aplica formatação do Prettier em todos os arquivos do projeto
