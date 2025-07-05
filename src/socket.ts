import { io } from "socket.io-client";

const socket = io("https://the-killer.onrender.com"); // Adresse de ton serveur

export default socket;
