El usuario quiere guardar un checkpoint del proyecto en git.

1. Corre `git add -A` para stagear todos los cambios
2. Corre `git commit -m "$ARGUMENTS"` usando exactamente el texto que el usuario pasó como argumento
3. Corre `git push`
4. Muestra el resultado de `git status`
5. Muestra las últimas 5 entradas de `git log --oneline`

Si no se proporcionó un nombre de checkpoint, pídelo antes de continuar.
