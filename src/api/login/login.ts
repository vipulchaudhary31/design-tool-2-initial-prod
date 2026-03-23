import { apiClient, setToken } from '@/api/client';
import type { LoginRequest, LoginResponse } from './types';
import { API_ENDPOINTS } from '@/api/constants';

const ALLOWED_USERS: Record<string, string> = {
  "lakshman.g@getlokalapp.com": "17bead68370f124e2cb93ed2b4f966bee0245f39",
  "manjunath.h@getlokalapp.com": "68aaa5036c5c8cb72e7fa30c63ef711d93d7ba98",
  "charusheela.pote@getlokalapp.com": "5c87daf062d53752a78300a3911e10dabc465e88",
  "mvnu.mahesh@getlokalapp.com": "f685ed43319f81f75a3a6f0a683117b36a68b471",
  "tejaswini@getlokalapp.com": "b25c627368fb12e6645ee7cdb6f738ccb499758a",
  "krishnakumar@getlokalapp.com": "f20867c2f8980e137a06c9599b4cfdf5bd20e201",
  "sourav.s@getlokalapp.com": "4a351010b9250bec1b8d8446170f9cbaef73b5cb",
  "nikhila@getlokalapp.com": "2070051b1d08c212894f3f7db2aad5e90251bb00",
  "shahab.uddin@getlokalapp.com": "00304c566018ba589a34b48a0c14569cd89d077d",
  "hd.vishwas@getlokalapp.com": "389bfcd00ed8bc9884000d6a01557f62e17bee58"
};

export async function login(email: LoginRequest['email'], password: LoginRequest['password']) {
  const normalizedEmail = email.toLowerCase().trim();
  const assignedToken = ALLOWED_USERS[normalizedEmail];

  if (!assignedToken) {
    throw new Error("Access denied. Your email is not whitelisted.");
  }

  const namePart = normalizedEmail.split('@')[0];
  const expectedPassword = `${namePart}123`;

  if (password !== expectedPassword) {
    throw new Error("Invalid password.");
  }

  setToken(assignedToken);
}
