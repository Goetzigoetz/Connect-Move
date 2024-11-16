import { SENDGRID_FROM, SENDGRID_API_KEY } from "@env";
import axios from "axios";
import sendNotifs from "./sendNotifs";
import { BASE_URL } from "@env";

function enleverEspaces(chaine) {
  return chaine.replace(/\s/g, "");
}

async function sendWelcomeMail(mail) {
  // send mail

  await axios.post(
    "https://api.sendgrid.com/v3/mail/send",
    {
      personalizations: [
        {
          to: [
            {
              email: `${mail}`,
            },
          ],
        },
      ],
      from: {
        email: `${SENDGRID_FROM}`,
        name: "MyLoka",
      },

      template_id: enleverEspaces(`d-dac9337b06b649dab7e94a44eb18af57`),
    },
    {
      headers: {
        authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
}

const sendMessageMail = async (user, message) => {
  await axios.post(
    "https://api.sendgrid.com/v3/mail/send",
    {
      personalizations: [
        {
          to: [
            {
              email: `${user.email}`,
              name: `${user.firstName}` + " " + `${user.lastName}`,
            },
          ],
          dynamic_template_data: {
            subject: `${!message.subject ? message.title : message.subject}`,
            btnTitle: `${
              !message.btnTitle ? "Ouvrir l'application" : message.btnTitle
            }`,
            btnUrl: `${BASE_URL}${!message.btnUrl ? "/" : message.btnUrl}`,
            title: `${message.title}`,
            message: `${message.desc}`,
          },
        },
      ],

      from: {
        email: `${SENDGRID_FROM}`,
        name: "MyLoka",
      },
      reply_to: {
        email: `${SENDGRID_FROM}`,
        name: "MyLoka",
      },
      template_id: enleverEspaces(`d-0fcb4ca96e564fd3b7dfe1f2176d4711`),
    },
    {
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  sendNotifs(user, message);
};

export { sendWelcomeMail, sendMessageMail };
