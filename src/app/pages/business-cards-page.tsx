import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { TopNavbar } from "../components/top-navbar";
import {
  getMyBusinessCards,
  assignCardByEmail,
  type BusinessCardRow,
} from "../lib/business-service";

export function BusinessCardsPage() {

  const [cards, setCards] = useState<BusinessCardRow[]>([]);
  const [email, setEmail] = useState("");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const load = async () => {
    const data = await getMyBusinessCards();
    setCards(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAssign = async () => {

    if (!selectedCard) return;

    // await assignCardByEmail(
    //   selectedCard,
    //   email
    // );

    setEmail("");
    setSelectedCard(null);

    load();
  };

  return (

    <div className="flex min-h-screen bg-gray-50">

      <Sidebar />

      <div className="flex-1 flex flex-col">

        <TopNavbar />

        <main className="p-6">

          <h1 className="text-2xl font-bold mb-4">
            Business Cards
          </h1>

          <div className="space-y-4">

            {cards.map(card => (

              <div
                key={card.id}
                className="border rounded-lg p-4"
              >

                <div>
                  UID: {card.card_uid}
                </div>

                <div>
                  Assigned:
                  {card.assigned_email || "none"}
                </div>

                <button
                  onClick={() => setSelectedCard(card.id)}
                >
                  Assign
                </button>

              </div>

            ))}

          </div>

          {selectedCard && (

            <div className="mt-6">

              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email"
              />

              <button
                onClick={handleAssign}
              >
                Assign
              </button>

            </div>

          )}

        </main>

      </div>

    </div>

  );

}