import type { AppGreyingConfig } from '@/utils/AppGreyingConfigType';
import { GENAI_BADGES } from '@/utils/constants';
import { appsGreyingConfig } from '@/utils/storage';
import type { ChangeEvent } from 'react';
import './App.css';

async function setConfigValue(icon: string, status: string, event: ChangeEvent<HTMLInputElement>) {
	const value = await appsGreyingConfig.getValue();

	value[icon] = value[icon] || {};
	value[icon][status] = !event.target?.checked;

	await appsGreyingConfig.setValue(value);
}

function AppFilterTable() {
	const [config, setConfig] = useState<AppGreyingConfig>({});
	useEffect(() => {
		const unwatch = storage.watch<AppGreyingConfig>('local:apps-greying-config', (newValue) => {
			if (newValue) {
				setConfig(newValue);
			}
		});

		(async () => {
			setConfig(await appsGreyingConfig.getValue());
		})();

		return () => unwatch();
	}, []);
	const columnsTh = [<th key={'th-empty'}></th>];
	for (const status of STATUS_TYPES) {
		columnsTh.push(<th key={status}>{status}</th>);
	}

	const lines = [];
	for (const icon of GENAI_BADGES) {
		const columns = [<td key={icon + '-first'}>{i18n.t('badges.' + icon)}</td>];
		for (const status of STATUS_TYPES) {
			columns.push(
				<td key={icon + '-' + status}>
					<input
						type="checkbox"
						checked={config[icon]?.[status] ?? false}
						onChange={(e) => setConfigValue(icon, status, e)}
					/>
				</td>
			);
		}
		lines.push(<tr key={icon}>{...columns}</tr>)
	}

	return (
		<>
			<table>
				<thead><tr>{...columnsTh}</tr></thead>
				<tbody>{...lines}</tbody>
			</table>

			<div id="popup-table-captions">
				<h2>{i18n.t('popup.badges_status_details')}</h2>
				{STATUS_TYPES.map((status) => <p><b>{status}</b>: {i18n.t('status.' + status)}</p>)}
			</div>
		</>
	);
}

function App() {
	return (
		<>
			<h1>Behold! The Slop-Inator!</h1>
			<img src="/doof-pic.png" alt="Behold! The Slop-Inator!" />
			<h2><a href="https://github.com/Dysnomia-Studio/slopinator#contribution" target='_blank'>{i18n.t('popup.contribute_msg')}</a></h2>
			<hr />
			<h2>{i18n.t('popup.greying_title')}</h2>
			<AppFilterTable />
		</>
	);
}

export default App;
