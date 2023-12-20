import { useFocusTrap } from '@solidjs-use/integrations/useFocusTrap';
import { For, JSX, Show, createEffect, createSignal, onMount } from 'solid-js';
import { Transition } from 'solid-transition-group';

import { LocaleKey, t } from '@modules/i18n';
import { createStoreListener } from '@stores/index';
import LayerStore from '@stores/layer';
import ModalStore from '@stores/modal';
import * as ipc from '~/common/ipc';

import Button from '@ui/Common/Button';
import Icon from '@ui/Common/Icon';
import Layer from '@ui/Layer';

import './index.scss';

const ipcRenderer = window.Native.DANGEROUS__NODE__REQUIRE(
	'electron:ipcRenderer'
) as typeof import('electron').ipcRenderer;

interface ModalProps {
	transitions: {
		enter: (el: HTMLElement, done: () => void) => void;
		exit: (el: HTMLElement, done: () => void) => void;
	};
	dismissable?: boolean;
	children: (props: { close: () => void }) => JSX.Element | JSX.Element[];
	size: 'small' | 'medium' | 'large' | 'x-large';
}

let opened = 1;

const Modal = (props: ModalProps) => {
	const [ref, setRef] = createSignal<HTMLElement>(null);
	const [open, setOpen] = createSignal(false);

	const { activate, deactivate } = useFocusTrap(ref, {
		onDeactivate: () => {
			if (props.dismissable) {
				close();
			}
		}
	});

	onMount(() => {
		requestAnimationFrame(() => {
			setOpen(true);

			activate();
		});
	});

	const close = () => {
		setOpen(false);

		deactivate();

		setTimeout(() => {
			// allow any transitions to finish

			ModalStore.removeModal(ModalStore.modals.find((m) => m.element === ref()));
		}, 1000);
	};

	return (
		<div
			ref={setRef}
			onMouseDown={(e) => {
				if (props.dismissable && e.target === ref()) {
					close();
				}
			}}
			classList={{
				'modal-container': true,
				visible: open()
			}}
			style={{
				'z-index': 98 + opened++
			}}
		>
			<Transition onEnter={props.transitions.enter} onExit={props.transitions.exit}>
				<Show when={open()}>
					<dialog
						open={open()}
						classList={{
							modal: true,
							[props.size || '']: true
						}}
					>
						{<props.children close={close}></props.children>}
					</dialog>
				</Show>
			</Transition>
		</div>
	);
};

export const ModalCloseButton = (props: { close: () => void }) => {
	return (
		<button
			aria-role="button"
			aria-label={t('modal.closeModal')}
			class="modal__close"
			onClick={props.close}
		>
			<Icon size={24} variant={24} name="x-circle" />
		</button>
	);
};

export const ModalHeader = (props: {
	title?: JSX.Element;
	children: JSX.Element | JSX.Element[];
}) => {
	return (
		<div class="modal__header">
			{props.title && <h2 class="modal__header__title">{props.title}</h2>}
			{props.children}
		</div>
	);
};

export const ModalBody = (props: { children: JSX.Element | JSX.Element[] }) => {
	return <div class="modal__body">{props.children}</div>;
};

export const ModalFooter = (props: { children: JSX.Element | JSX.Element[] }) => {
	return <div class="modal__footer">{props.children}</div>;
};

export default Modal;

Modal.Layer = () => {
	const modals = createStoreListener([ModalStore], () => ModalStore.modals);

	createEffect(() => {
		if (modals().length > 0) {
			LayerStore.setVisible('modal', true);
		} else {
			LayerStore.setVisible('modal', false);
		}
	});

	return (
		<Layer key="modal" transitions={Layer.Transitions.None} type="bare">
			<For each={modals()}>{(modal) => modal.element}</For>
		</Layer>
	);
};

export const showErrorModal = (error: Error | string, message: LocaleKey) => {
	ModalStore.addModal({
		type: 'error',
		element: (
			<Modal size="small" dismissable transitions={Layer.Transitions.Fade}>
				{(props) => {
					return (
						<>
							<ModalHeader title={t(message)}>
								<ModalCloseButton close={props.close} />
							</ModalHeader>
							<ModalBody>
								<p class="error-modal__message">{error['message'] || error}</p>
								<Show when={error['stack']}>
									<pre class="error-modal__stack">{error['stack']}</pre>
								</Show>
							</ModalBody>
							<ModalFooter>
								<div class="modal__footer__buttons">
									<Button
										type="default"
										label={t('modal.closeModal')}
										onClick={props.close}
									>
										{t('modal.close')}
									</Button>
									<Button
										type="danger"
										label={t('modal.error.reloadClient')}
										onClick={() => {
											ipcRenderer.invoke(ipc.RELOAD_CLIENT);
										}}
									>
										{t('modal.error.reload')}
									</Button>
								</div>
							</ModalFooter>
						</>
					);
				}}
			</Modal>
		)
	});
};

window._showErrorModal = showErrorModal;
