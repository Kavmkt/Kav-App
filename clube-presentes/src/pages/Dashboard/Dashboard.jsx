import { useCallback, useEffect, useState } from 'react';
import Header from '../../components/Common/Header';
import Loader from '../../components/Common/Loader';
import PackageStatus from '../../components/Dashboard/PackageStatus';
import DatesList from '../../components/Dashboard/DatesList';
import ItemSelectionModal from '../../components/Items/ItemSelectionModal';
import { useAuth } from '../../context/AuthContext';
import {
  getActiveItems,
  getActiveSubscription,
  getPackage,
  getSelections,
  saveSelection,
} from '../../services/db';
import { canChangeSelection } from '../../utils/dateHelpers';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [items, setItems] = useState([]);
  const [selectionsByDate, setSelectionsByDate] = useState({});
  const [activeDate, setActiveDate] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError('');
    try {
      const activeSubscription = await getActiveSubscription(user.uid);
      const [packageData, activeItems, selections] = await Promise.all([
        activeSubscription ? getPackage(activeSubscription.packageId) : Promise.resolve(null),
        getActiveItems(),
        activeSubscription ? getSelections(activeSubscription.id) : Promise.resolve([]),
      ]);

      setSubscription(activeSubscription);
      setPkg(packageData);
      setItems(activeItems);

      const byDate = {};
      selections.forEach((selection) => {
        byDate[selection.date] = selection;
      });
      setSelectionsByDate(byDate);
    } catch (err) {
      console.error(err);
      setLoadError('Não foi possível carregar seus dados agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleConfirmSelection(item) {
    if (!activeDate || !subscription || !user) return;
    if (!canChangeSelection(activeDate)) return;

    await saveSelection({
      userId: user.uid,
      subscriptionId: subscription.id,
      date: activeDate,
      itemId: item.id,
    });

    setSelectionsByDate((prev) => ({
      ...prev,
      [activeDate]: { ...prev[activeDate], date: activeDate, itemId: item.id, confirmed: true },
    }));
    setActiveDate(null);
  }

  return (
    <div className="min-h-screen bg-rose-50/40">
      <Header />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {loading ? (
          <Loader label="Carregando seu clube de presentes..." />
        ) : loadError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {loadError}
          </p>
        ) : (
          <>
            <PackageStatus pkg={pkg} subscription={subscription} />

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Suas datas de presente
              </h2>
              <DatesList
                dates={subscription?.selectedDates || []}
                selections={selectionsByDate}
                items={items}
                onSelectDate={setActiveDate}
              />
            </section>
          </>
        )}
      </main>

      {activeDate && (
        <ItemSelectionModal
          date={activeDate}
          items={items}
          currentItemId={selectionsByDate[activeDate]?.itemId}
          onConfirm={handleConfirmSelection}
          onClose={() => setActiveDate(null)}
        />
      )}
    </div>
  );
}
