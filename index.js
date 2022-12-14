const getAdobeInstances = require('./src/connection');

const { PROPERTYID } = process.env;
const delegate_descriptor_id = 'adobe-analytics::actions::send-beacon';

async function fetchAllRules(
  reactor,
  id,
  page = 0,
  previous = [],
  ) {
  const data = await reactor.listRulesForProperty(id,{
      'page[number]': page,
      'page[size]': 100,
    }).catch(e => {
      throw new Error(`Error with listFunction: ${e}`);
    });


    const response = [...previous, ...data.data];

    if (data?.meta?.pagination?.['next_page']) {
      return fetchAll(reactor, id, data?.meta?.pagination['next_page'], response);
    }

    return response;
}

async function fetchAllRuleComponents (reactor, rules = []) {
  const ruleComponents = await Promise.all(rules.map(async rule => { const r = await reactor.listRuleComponentsForRule(rule?.id); return { ruleName: rule?.attributes?.name, ruleId: rule?.id, ruleComponents: r?.data?.filter(rc => rc?.attributes?.delegate_descriptor_id === delegate_descriptor_id && JSON.parse(rc?.attributes?.settings)?.type === 'link') }}));

  return ruleComponents;
}

const test = async () => {
  try {
    const { reactor } = await getAdobeInstances();
   
    const rules = await fetchAllRules(reactor, PROPERTYID);
    
    const ruleComponentsGrouped = await fetchAllRuleComponents(reactor, rules);

    const ruleComponents = ruleComponentsGrouped.reduce((acc, ruleComponentGroup) => {
      if (ruleComponentGroup?.ruleComponents?.length) {
        acc = [...acc, ...ruleComponentGroup.ruleComponents];
      }
      return acc;
    }, []);

    console.log(`Updating ${ruleComponents?.length} ruleComponents`);

    const updatedRuleComponents = await Promise.all(ruleComponents.map(async ruleComponent => {
      const settings = JSON.parse(ruleComponent?.attributes?.settings);
      console.log(`Updating ${ruleComponent?.id}: ${settings?.linkName}`);
      const updatedRuleComponent = await reactor.updateRuleComponent({
        id: ruleComponent?.id,
        attributes: {
          ...ruleComponent?.attributes,
          settings: JSON.stringify({
            ...settings,
            linkName: '%Custom Link Name | [APL]%',
          }),
        },
        type: 'rule_components',
      });

      return updatedRuleComponent;
    })).catch(e => {
      throw new Error(`Error updating ruleComponents: ${e}`);
    });

    console.log('SUCCESS');
  } catch (err) {
    console.log(err);
  }
}

test();
