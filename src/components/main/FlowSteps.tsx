import { MAIN } from '@shared/messages'

export function FlowSteps() {
  return (
    <section className="section" id="flow" aria-labelledby="flow-title">
      <div className="section__inner">
        <h2 className="section__title" id="flow-title">
          {MAIN.flowTitle}
        </h2>
        <p className="section__sub">{MAIN.flowSubtitle}</p>
        <ol className="flow">
          {MAIN.flowSteps.map((step, i) => (
            <li className="flow__item" key={step}>
              <div className="flow__top">
                <span className="flow__num">STEP {String(i + 1).padStart(2, '0')}</span>
                <span className="flow__icon" aria-hidden="true">
                  {MAIN.flowDetails[i].icon}
                </span>
              </div>
              <h3 className="flow__text">{step}</h3>
              <p className="flow__desc">{MAIN.flowDetails[i].desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
