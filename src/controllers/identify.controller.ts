import { Request, Response } from "express";
import { processIdentity } from "../services/identity.service";
import { validateInput } from "../utils/validate.util";


export const identifyContact = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: "At least one of email or phoneNumber must be provided",
      });
    }

    const result = await processIdentity(email, phoneNumber);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in identifyContact:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};