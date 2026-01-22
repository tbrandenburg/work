#!/bin/bash

# Commands that need to be updated to extend BaseCommand
commands=(
  "src/cli/commands/comment.ts"
  "src/cli/commands/move.ts" 
  "src/cli/commands/delete.ts"
  "src/cli/commands/context/remove.ts"
  "src/cli/commands/context/show.ts"
  "src/cli/commands/context/add.ts"
  "src/cli/commands/context/set.ts"
  "src/cli/commands/unlink.ts"
  "src/cli/commands/unset.ts"
  "src/cli/commands/link.ts"
  "src/cli/commands/schema/attrs.ts"
  "src/cli/commands/schema/show.ts"
  "src/cli/commands/schema/kinds.ts"
  "src/cli/commands/schema/relations.ts"
)

for cmd in "${commands[@]}"; do
  echo "Updating $cmd..."
  
  # Replace Command import with BaseCommand
  sed -i 's/import { \([^}]*\)Command\([^}]*\) } from/import { \1 } from/' "$cmd"
  sed -i '1a import { BaseCommand } from '"'"'../base-command.js'"'"';' "$cmd"
  sed -i '1a import { formatOutput } from '"'"'../formatter.js'"'"';' "$cmd"
  
  # Update class declaration
  sed -i 's/extends Command/extends BaseCommand/' "$cmd"
  
  # Replace format flag with BaseCommand.baseFlags
  sed -i '/format: Flags\.string/,/}),/c\    ...BaseCommand.baseFlags,' "$cmd"
  
done

echo "Batch update complete!"
