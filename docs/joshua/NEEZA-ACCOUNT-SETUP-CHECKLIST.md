# Neeza: create the four logins (about 20 minutes)

Nobody can use the console until this is done. You will run one command on the hosting terminal, four times. Nothing
secret goes into WhatsApp, email, GitHub or this chat while you do it.

## The four accounts

| Person | Username to type | Role to type | What they can do |
| --- | --- | --- | --- |
| Joshua | `joshua` | `coordinator` | Record contributions, see records, prepare walk updates, make graphics, download reports |
| Neeza | `neeza` | `coordinator` | The same |
| The treasurer or accountant | their first name in lowercase, for example `grace` | `finance` | Check receipts against bank and mobile-money records, reconcile, reverse, approve consent and the milestone |
| Shyaka Mbanda | `shyaka` | `owner` | Publish walking updates from the road (town, date, kilometres, photo) and make graphics. Cannot see private money records or approve receipts |

A coordinator can never confirm money as received. That is deliberate: the person who records a payment is not the
person who verifies it. Joshua's message promised Shyaka could share updates from the walk; the `owner` role is what
allows that.

## Before you start

1. Write down each person's username and role from the table, and the treasurer's real name.
2. For each person, create a **different** password of at least **14 characters** in your phone's password manager.
   Do not reuse one. You will type each one twice, and you will send it to that person privately afterwards.
3. Have the hosting login (cPanel) open on a laptop. A phone is awkward for the terminal step.

## Steps

1. In cPanel, open **File Manager** and go to the website's main folder (the one that contains `index.html` and the
   `api` folder). If you are unsure which folder, ask your hosting provider before continuing; do not guess.
2. Download `https://pamodzici.com/assets/operations/setup/PCI_Account_Setup.zip`, upload it to that folder and
   **Extract** it there. It adds two small files in a `scripts` folder and a short instruction file. It contains no
   passwords and no private settings.
3. In cPanel, open **Terminal** (or connect over SSH) and move into the same folder. It should show `scripts` and
   `api` when you list its contents.
4. Run:

   ```
   php scripts/setup-operations-user.php
   ```

5. It asks four things. Answer them in this order:
   - **Username:** for example `joshua`.
   - **Role:** type `coordinator` (or `finance`, `owner` as in the table).
   - **New personal password (hidden):** nothing appears as you type. Enter the password you made for this person.
   - **Repeat password (hidden):** type it again. If the two differ, nothing is changed and you simply start again.
6. When it says the account is activated, **run the same command again** for the next person. Do all four.
7. Send each person their username and password **privately and separately** (not in the group chat). Tell them to
   save it and not share it.

If a username already exists the helper asks you to type `replace` before it changes anything. That is also how
you change someone's password later: run the command again and type `replace`. There is no "change my password"
button in the console yet.

## Check it worked (5 minutes)

1. Open `https://pamodzici.com/admin/operations/` and sign in as **Joshua**. You should see: *Record contribution*,
   *Review payments*, *Download report*, *Update walk status*, *Generate graphic*. You should **not** see
   *Verify & reconcile*.
2. Sign out and sign in as the **treasurer**. They should be able to open a record and verify it.
3. Sign in as **Shyaka**. He should be able to prepare and publish a walk update, but not see private money records.
4. Do **not** record a practice donation. To rehearse, use *Generate graphic* then *SAMPLE DATA*, which writes
   nothing to the ledger.

## Then

- Joshua opens `https://pamodzici.com/admin/operations/start.html` on his phone and follows the 10-minute practice.
- The treasurer exports each Excel register to CSV and uses *Import a contribution register* to preview it (see the
  note below). Nothing is counted publicly until each receipt is reconciled.
- Tell me when the four logins work, and I will check the training steps against what you see.

## Notes

- Hosting backups: take your host's normal backup first. The helper also makes its own backup of the private
  configuration before changing it.
- The helper only works in a terminal. Opening it in a browser returns "not found" on purpose.
- Please do not paste any password, hosting login or SSH key into this chat, GitHub, a ticket or a build log.
