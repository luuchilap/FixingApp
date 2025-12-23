# Fixing Runtime Errors

## Errors to Fix:
1. `Property 'authScreen' doesn't exist` - Cache issue
2. `Tried to register two views with the same name RNCAndroidDialogPicker` - Picker hot reload issue

## Solution:

### Step 1: Stop the current Metro bundler
Press `Ctrl+C` in the terminal running `expo start`

### Step 2: Clear cache and restart
```bash
cd mobile
npx expo start --clear
```

### Step 3: Restart the app completely
- Close the app completely on your device/emulator
- Reopen it (don't just reload)

### Alternative: Full clean restart
```bash
cd mobile
rm -rf node_modules/.cache
npx expo start --clear
```

## Note:
The picker errors are harmless in development but can be annoying. They occur because the native module gets registered twice during hot reload. A full app restart (not hot reload) fixes this.

