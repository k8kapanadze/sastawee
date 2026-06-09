# სასტაwe — Private Media Gallery

პირადი ფოტო და ვიდეო გალერეა Firebase-ით ან localStorage-ით.

## დაყენება

**Prerequisites:** Node.js 18+

1. დაყენება:
   ```bash
   npm install
   ```

2. Firebase კონფიგურაცია (სურვილისამებრ):
   - შექმენით `.env.local` ფაილი:
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     VITE_FIREBASE_STORAGE_BUCKET=...
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     ```
   - Firebase-ის გარეშე აპი ავტომატურად გამოიყენებს localStorage-ს.

3. გაშვება:
   ```bash
   npm run dev
   ```

4. Build:
   ```bash
   npm run build
   ```

## ფუნქციონალი

- პაროლით დაცული გალერეა
- სურათების და ვიდეოების ატვირთვა (drag & drop ან URL)
- ავტორების მიხედვით ფილტრაცია
- ალბომების შექმნა და მართვა
- სლაიდშოუ რეჟიმი
- Lightbox ნავიგაცია
- iOS-ზე ფოტოების შენახვა
- Firebase Firestore ან localStorage fallback
