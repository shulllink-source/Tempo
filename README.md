# Tempo

Tempo est une application mobile de gestion du temps en français, construite avec React Native, Expo SDK 54, Expo Router, TypeScript et Zustand.

## Démarrer

```bash
npm install
npx expo start
```

Ouvrir avec Expo Go (les modules natifs comme la bibliothèque audio peuvent nécessiter un development build).

## Android

```bash
eas build -p android --profile preview
```

Le profil `preview` produit un APK installable. Les permissions Android incluent les notifications, la vibration et `READ_MEDIA_AUDIO`.

## Structure

- `app/` : routes Dashboard, Horloge, Timer, Activités, Notes, Agenda, Musique, Statistiques, Réglages.
- `src/stores/` : persistance locale AsyncStorage pour settings, timer, activités, notes et dashboard.
- `src/theme.ts` : thème sombre/clair piloté par les réglages.

## Limites

Le glisser-déposer avancé des modules, les notifications programmées, les haptics détaillés, la lecture audio complète et la bulle flottante au-dessus des autres applications sont à finaliser dans une itération native dédiée. L'overlay hors application n'est pas réalisé.
