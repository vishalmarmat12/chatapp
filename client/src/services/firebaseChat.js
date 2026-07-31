import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { db, auth } from '../firebase';

// 1. Firebase Authentication Services
export const registerWithFirebase = async (email, password, fullname, username) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  const unique_id = 'BC-' + Math.floor(100000 + Math.random() * 900000);

  const userData = {
    id: uid,
    email,
    fullname,
    username,
    unique_id,
    bio: 'Hey there! I am using Calculator Vault.',
    profile_photo: '',
    status: 'online',
    created_at: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', uid), userData);
  return userData;
};

export const loginWithFirebase = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.exists() ? userDoc.data() : { id: uid, email };
};

export const logoutFirebase = async () => {
  return await signOut(auth);
};

// 2. Real-Time Chat Messaging Services
export const sendMessageFirebase = async (senderId, receiverId, text, messageType = 'text') => {
  return await addDoc(collection(db, 'messages'), {
    sender_id: senderId,
    receiver_id: receiverId,
    message: text,
    message_type: messageType,
    created_at: serverTimestamp()
  });
};

export const subscribeToMessagesFirebase = (userId, friendId, callback) => {
  const q = query(
    collection(db, 'messages'),
    orderBy('created_at', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (
        (data.sender_id === userId && data.receiver_id === friendId) ||
        (data.sender_id === friendId && data.receiver_id === userId)
      ) {
        list.push({ id: doc.id, ...data });
      }
    });
    callback(list);
  });
};
