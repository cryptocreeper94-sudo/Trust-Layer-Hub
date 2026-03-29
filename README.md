# Trust Layer Hub

Mobile companion app for the Trust Layer ecosystem — manage identity, view SIG token balance, access ecosystem apps, and receive push notifications.

**Live:** [trusthub.tlid.io](https://trusthub.tlid.io)

## Stack

| Layer | Tech |
|---|---|
| Framework | Expo (React Native) |
| Navigation | Expo Router |
| Backend | Trust Layer API (dwtl.io) |
| Auth | Trust Layer SSO |

## Structure

```
trust-layer-hub/
├── app/              # Expo Router screens
├── components/       # Shared UI components
├── constants/        # App configuration
└── assets/           # Images and fonts
```

## Development

```bash
npm install
npx expo start
```
