import dotenv from 'dotenv';

dotenv.config({});

const env = process.env;
export const POSTGRES_DB=env.POSTGRES_DB;
export const NODE_ENV=env.NODE_ENV;
export const SECRET_KEY_ONE=env.SECRET_KEY_ONE;
export const SECRET_KEY_TWO=env.SECRET_KEY_TWO;
export const JWT_TOKEN=env.JWT_TOKEN;
export const SENDER_EMAIL=env.SENDER_EMAIL;
export const SENDER_EMAIL_PASSWORD=env.SENDER_EMAIL_PASSWORD;
export const CLIENT_URL=env.CLIENT_URL;
export const PORT=env.PORT;