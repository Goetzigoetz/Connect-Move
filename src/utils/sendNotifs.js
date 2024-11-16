import { SENDGRID_FROM, SENDGRID_API_KEY } from "@env";
import { addDoc, collection } from "firebase/firestore";
import moment from "moment";
import { db } from "../../config/firebase";
import axios from "axios";

function enleverEspaces(chaine) {
  return chaine.replace(/\s/g, "");
}

export default async function sendNotifs(user, message) {
  // send push notif
  const MESSAGE = {
    to: user.expoPushToken,
    sound: "default",
    title: `${message.title}`,
    body: `${message.desc}`,
  };

  // save to db
  const DATA_TO_ADD = {
    title: `${message.title}`,
    text: `${message.desc}`,
    userId: `${user.id}`,
    isNew: true,
    type:
      !message.type ||
      message.type == null ||
      message.type == "" ||
      message.type == undefined
        ? null
        : message.type,
    createdAt: moment().format(),
  };

  if (user.expoPushToken !== undefined || user.expoPushToken !== "") {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(MESSAGE),
    });
    await addDoc(collection(db, "notifications"), DATA_TO_ADD);
  } else {
    await addDoc(collection(db, "notifications"), DATA_TO_ADD);
  }
}
